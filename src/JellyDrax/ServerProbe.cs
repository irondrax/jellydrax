using System.Net.Http;
using System.Security.Authentication;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace JellyDrax;

public sealed record ServerInfo(string BaseUrl, string Name, string Version, string? Id);

/// <summary>
/// Normalisiert eine vom Benutzer eingegebene Adresse und prüft über
/// /System/Info/Public, ob dort ein Jellyfin-Server antwortet.
/// </summary>
public static class ServerProbe
{
    private static readonly Regex WebSuffix = new(@"/web(/.*)?$", RegexOptions.IgnoreCase);
    private static readonly Regex ExplicitPort = new(@":\d+$");

    public static List<string> Candidates(string input)
    {
        var result = new List<string>();
        input = input.Trim();
        if (input.Length == 0) return result;

        var hasScheme = input.Contains("://", StringComparison.Ordinal);
        var raw = hasScheme ? input : "http://" + input;
        if (!Uri.TryCreate(raw, UriKind.Absolute, out var uri) || (uri.Scheme != "http" && uri.Scheme != "https"))
            return result;

        // Unterpfad (Reverse Proxy, z. B. https://host/jellyfin) behalten, "/web/..." entfernen
        var path = WebSuffix.Replace(uri.AbsolutePath, "").TrimEnd('/');

        var afterScheme = raw[(raw.IndexOf("://", StringComparison.Ordinal) + 3)..];
        var authority = afterScheme.Split('/', '?', '#')[0];
        var hasPort = ExplicitPort.IsMatch(authority);
        var host = uri.Host; // IPv6 inkl. eckiger Klammern
        var port = hasPort ? ":" + uri.Port : "";

        if (hasScheme)
        {
            result.Add($"{uri.Scheme}://{host}{port}{path}");
            if (!hasPort && uri.Scheme == "http")
                result.Add($"http://{host}:8096{path}");
        }
        else if (hasPort)
        {
            result.Add($"http://{host}{port}{path}");
            result.Add($"https://{host}{port}{path}");
        }
        else
        {
            result.Add($"http://{host}:8096{path}");
            result.Add($"https://{host}{path}");
            result.Add($"http://{host}{path}");
        }

        return result.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
    }

    public static async Task<(ServerInfo? Info, string? Error)> ProbeAsync(
        string input, bool acceptInvalidCertificate, CancellationToken ct)
    {
        var candidates = Candidates(input);
        if (candidates.Count == 0)
            return (null, "Ungültige Adresse. Beispiel: 192.168.1.10:8096 oder https://jellyfin.example.de");

        using var handler = new HttpClientHandler();
        if (acceptInvalidCertificate)
            handler.ServerCertificateCustomValidationCallback = (_, _, _, _) => true;
        using var http = new HttpClient(handler) { Timeout = TimeSpan.FromSeconds(6) };

        string? lastError = null;
        foreach (var baseUrl in candidates)
        {
            ct.ThrowIfCancellationRequested();
            try
            {
                var json = await http.GetStringAsync(baseUrl + "/System/Info/Public", ct);
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;
                if (!root.TryGetProperty("Version", out var version))
                {
                    lastError = $"{baseUrl} antwortet, ist aber kein Jellyfin-Server.";
                    continue;
                }
                var name = root.TryGetProperty("ServerName", out var n) ? n.GetString() : null;
                var id = root.TryGetProperty("Id", out var i) ? i.GetString() : null;
                return (new ServerInfo(baseUrl, name ?? "Jellyfin", version.GetString() ?? "?", id), null);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                lastError = Describe(baseUrl, ex);
            }
        }
        return (null, lastError);
    }

    private static string Describe(string url, Exception ex)
    {
        for (var e = ex; e != null; e = e.InnerException)
        {
            if (e is AuthenticationException)
                return $"Das TLS-Zertifikat von {url} ist nicht vertrauenswürdig. " +
                       "Bei einem selbstsignierten Zertifikat die Option \"Zertifikat akzeptieren\" aktivieren.";
        }
        return ex switch
        {
            TaskCanceledException => $"Zeitüberschreitung bei {url}.",
            JsonException => $"{url} antwortet, ist aber kein Jellyfin-Server.",
            HttpRequestException { StatusCode: not null } h => $"{url} antwortet mit HTTP {(int)h.StatusCode.Value}.",
            _ => $"Keine Verbindung zu {url}: {ex.Message}",
        };
    }
}
