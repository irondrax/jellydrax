using System.Net.Http;
using System.Net.Http.Headers;
using System.Reflection;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.Win32;

namespace JellyDrax;

/// <summary>Neueste Version laut GitHub-Release.</summary>
public sealed record UpdateInfo(
    Version Latest,
    string Tag,
    string Notes,
    string HtmlUrl,
    ReleaseAsset? Setup,
    ReleaseAsset? Exe);

/// <summary>Eine Datei eines Releases. <see cref="ApiUrl"/> lädt auch aus privaten Repositorys (mit Token).</summary>
public sealed record ReleaseAsset(string Name, string ApiUrl, long Size, string? Sha256);

/// <summary>
/// Sucht unter https://github.com/irondrax/jellydrax/releases nach einer neueren Version, lädt sie
/// herunter, prüft die SHA-256-Prüfsumme und installiert sie:
///  - installierte Version: Installer im Hintergrund (/S /UPDATE), der JellyDrax danach neu startet
///  - einzelne EXE: neue EXE neben die alte legen, tauschen, neu starten
/// </summary>
public sealed class Updater
{
    public const string Repository = "irondrax/jellydrax";
    private const string UninstallKey = @"Software\Microsoft\Windows\CurrentVersion\Uninstall\JellyDrax";

    private readonly HttpClient _http;

    public Updater()
    {
        _http = new HttpClient { Timeout = TimeSpan.FromMinutes(10) };
        _http.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("JellyDrax", CurrentVersion.ToString(3)));
        _http.DefaultRequestHeaders.Add("X-GitHub-Api-Version", "2022-11-28");
    }

    public static Version CurrentVersion
    {
        get
        {
            var v = Assembly.GetExecutingAssembly().GetName().Version ?? new Version(0, 0, 0);
            return new Version(v.Major, v.Minor, Math.Max(0, v.Build));
        }
    }

    /// <summary>Installiert (über den Installer) oder als einzelne EXE gestartet?</summary>
    public static bool IsInstalled
    {
        get
        {
            try
            {
                using var key = Registry.CurrentUser.OpenSubKey(UninstallKey);
                var location = key?.GetValue("InstallLocation") as string;
                var exeDir = Path.GetDirectoryName(Environment.ProcessPath ?? Application.ExecutablePath);
                return !string.IsNullOrEmpty(location) && exeDir != null &&
                       string.Equals(Path.GetFullPath(location).TrimEnd('\\'), Path.GetFullPath(exeDir).TrimEnd('\\'), StringComparison.OrdinalIgnoreCase);
            }
            catch
            {
                return false;
            }
        }
    }

    private HttpRequestMessage Request(string url, string accept, string? token)
    {
        var req = new HttpRequestMessage(HttpMethod.Get, url);
        req.Headers.Accept.ParseAdd(accept);
        if (!string.IsNullOrWhiteSpace(token))
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return req;
    }

    public async Task<UpdateInfo> GetLatestAsync(string? token, CancellationToken ct)
    {
        using var req = Request($"https://api.github.com/repos/{Repository}/releases/latest", "application/vnd.github+json", token);
        using var res = await _http.SendAsync(req, ct);
        if (res.StatusCode == System.Net.HttpStatusCode.NotFound)
            throw new InvalidOperationException(string.IsNullOrWhiteSpace(token)
                ? "Kein Release gefunden. Ist das Repository privat? Dann unten einen GitHub-Token eintragen oder das Repository öffentlich machen."
                : "Kein Release gefunden – hat der Token Lesezugriff auf das Repository?");
        if (res.StatusCode is System.Net.HttpStatusCode.Unauthorized)
            throw new InvalidOperationException("Der GitHub-Token ist ungültig oder abgelaufen.");
        if (res.StatusCode is System.Net.HttpStatusCode.Forbidden or System.Net.HttpStatusCode.TooManyRequests)
            throw new InvalidOperationException("GitHub hat die Anfrage abgelehnt (zu viele Abfragen). Bitte später erneut versuchen.");
        res.EnsureSuccessStatusCode();

        using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync(ct));
        var root = doc.RootElement;
        var tag = root.GetProperty("tag_name").GetString() ?? "";
        if (!Version.TryParse(tag.TrimStart('v', 'V'), out var latest))
            throw new InvalidOperationException($"Unbekanntes Versionsformat: {tag}");

        ReleaseAsset? setup = null, exe = null;
        foreach (var a in root.GetProperty("assets").EnumerateArray())
        {
            var name = a.GetProperty("name").GetString() ?? "";
            var digest = a.TryGetProperty("digest", out var d) && d.ValueKind == JsonValueKind.String ? d.GetString() : null;
            var asset = new ReleaseAsset(name, a.GetProperty("url").GetString() ?? "", a.GetProperty("size").GetInt64(),
                digest != null && digest.StartsWith("sha256:", StringComparison.OrdinalIgnoreCase) ? digest[7..].ToLowerInvariant() : null);
            if (name.Equals($"JellyDrax-Setup-{latest.ToString(3)}.exe", StringComparison.OrdinalIgnoreCase)) setup = asset;
            else if (name.Equals("JellyDrax.exe", StringComparison.OrdinalIgnoreCase)) exe = asset;
        }

        return new UpdateInfo(latest, tag,
            root.TryGetProperty("body", out var body) ? body.GetString() ?? "" : "",
            root.TryGetProperty("html_url", out var html) ? html.GetString() ?? "" : $"https://github.com/{Repository}/releases",
            setup, exe);
    }

    /// <summary>Lädt eine Release-Datei und prüft Größe und (falls von GitHub angegeben) SHA-256.</summary>
    public async Task DownloadAsync(ReleaseAsset asset, string target, string? token, IProgress<double> progress, CancellationToken ct)
    {
        // Nur Dateien dieses Repositorys über die GitHub-API (leitet auf GitHubs Download-Server weiter;
        // HttpClient entfernt den Token bei der Weiterleitung auf einen anderen Host).
        if (!asset.ApiUrl.StartsWith($"https://api.github.com/repos/{Repository}/releases/assets/", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Unerwartete Download-Adresse.");

        using var req = Request(asset.ApiUrl, "application/octet-stream", token);
        using var res = await _http.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, ct);
        res.EnsureSuccessStatusCode();

        var temp = target + ".part";
        using (var sha = SHA256.Create())
        {
            await using (var input = await res.Content.ReadAsStreamAsync(ct))
            await using (var output = File.Create(temp))
            {
                var buffer = new byte[81920];
                long total = 0;
                int read;
                while ((read = await input.ReadAsync(buffer, ct)) > 0)
                {
                    await output.WriteAsync(buffer.AsMemory(0, read), ct);
                    sha.TransformBlock(buffer, 0, read, null, 0);
                    total += read;
                    if (asset.Size > 0) progress.Report(Math.Min(100, total * 100.0 / asset.Size));
                }
                sha.TransformFinalBlock(Array.Empty<byte>(), 0, 0);
                if (asset.Size > 0 && total != asset.Size)
                    throw new InvalidOperationException("Download unvollständig.");
            }

            var hash = Convert.ToHexString(sha.Hash!).ToLowerInvariant();
            if (asset.Sha256 != null && hash != asset.Sha256)
            {
                File.Delete(temp);
                throw new InvalidOperationException("Prüfsumme stimmt nicht – Update abgebrochen.");
            }
        }

        if (File.Exists(target)) File.Delete(target);
        File.Move(temp, target);
    }

    /// <summary>Reste eines früheren EXE-Updates entfernen.</summary>
    public static void CleanupAfterUpdate()
    {
        try
        {
            var exe = Environment.ProcessPath;
            if (exe != null && File.Exists(exe + ".old")) File.Delete(exe + ".old");
            var dir = Path.Combine(Path.GetTempPath(), "JellyDrax-Update");
            if (Directory.Exists(dir)) Directory.Delete(dir, true);
        }
        catch
        {
            // wird beim nächsten Start erneut versucht
        }
    }
}
