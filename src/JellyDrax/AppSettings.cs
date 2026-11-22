using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;

namespace JellyDrax;

public sealed class AppSettings
{
    public string? ServerUrl { get; set; }
    public List<string> RecentServers { get; set; } = new();
    /// <summary>Hosts, deren (z. B. selbstsignierte) Zertifikate akzeptiert werden.</summary>
    public List<string> TrustedCertificateHosts { get; set; } = new();
    public int[]? WindowBounds { get; set; }
    public bool Maximized { get; set; }
    public double Zoom { get; set; } = 1.0;
    /// <summary>Windows-Titelleiste ausblenden; Fenster-Buttons sitzen dann in der Oberfläche.</summary>
    public bool Frameless { get; set; } = true;
    /// <summary>Beim Start automatisch nach Updates suchen.</summary>
    public bool AutoUpdateCheck { get; set; } = true;
    public DateTime? LastUpdateCheck { get; set; }
    /// <summary>Optionaler GitHub-Token (für ein privates Repository), mit DPAPI für den Windows-Benutzer verschlüsselt.</summary>
    public string? UpdateTokenProtected { get; set; }

    /// <summary>JellyDrax-Design-Einstellungen (Themes, Media Bar, Animationen) – Inhalt verwaltet jellydrax.js.</summary>
    public JsonObject? Client { get; set; }

    /// <summary>Branding-CSS des Servers ignorieren (Standard: ja).</summary>
    [JsonIgnore]
    public bool IgnoreServerCss =>
        Client?["ignoreServerCss"] is JsonValue v && v.TryGetValue<bool>(out var b) ? b : true;

    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };

    /// <summary>
    /// Standard: %LOCALAPPDATA%\JellyDrax (Daten einer älteren "Jellyfin Desktop"-Installation werden übernommen).
    /// Portabler Modus: liegt neben der EXE eine Datei "portable.txt", wird ".\data" verwendet.
    /// </summary>
    public static string DataDir { get; } = ResolveDataDir();

    private static string FilePath => Path.Combine(DataDir, "settings.json");

    private static string ResolveDataDir()
    {
        var exeDir = AppContext.BaseDirectory;
        if (File.Exists(Path.Combine(exeDir, "portable.txt")))
            return Path.Combine(exeDir, "data");
        var local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        var dir = Path.Combine(local, "JellyDrax");
        var legacy = Path.Combine(local, "JellyfinDesktop");
        try
        {
            if (!Directory.Exists(dir) && Directory.Exists(legacy))
                Directory.Move(legacy, dir); // Server, Anmeldung und Fensterposition behalten
        }
        catch
        {
            // z. B. wenn die alte Version noch läuft -> mit neuem Ordner starten
        }
        return dir;
    }

    public static AppSettings Load()
    {
        try
        {
            if (File.Exists(FilePath))
                return JsonSerializer.Deserialize<AppSettings>(File.ReadAllText(FilePath)) ?? new AppSettings();
        }
        catch
        {
            // defekte Einstellungsdatei -> mit Standardwerten starten
        }
        return new AppSettings();
    }

    public void Save()
    {
        try
        {
            Directory.CreateDirectory(DataDir);
            File.WriteAllText(FilePath, JsonSerializer.Serialize(this, JsonOptions));
        }
        catch
        {
            // Einstellungen sind nicht kritisch
        }
    }

    public void AddRecent(string url)
    {
        RecentServers.RemoveAll(s => string.Equals(s, url, StringComparison.OrdinalIgnoreCase));
        RecentServers.Insert(0, url);
        if (RecentServers.Count > 8)
            RecentServers.RemoveRange(8, RecentServers.Count - 8);
    }

    [JsonIgnore]
    public string? UpdateToken
    {
        get
        {
            if (string.IsNullOrEmpty(UpdateTokenProtected)) return null;
            try
            {
                var data = System.Security.Cryptography.ProtectedData.Unprotect(
                    Convert.FromBase64String(UpdateTokenProtected), TokenEntropy, System.Security.Cryptography.DataProtectionScope.CurrentUser);
                return System.Text.Encoding.UTF8.GetString(data);
            }
            catch
            {
                return null;
            }
        }
        set
        {
            UpdateTokenProtected = string.IsNullOrWhiteSpace(value)
                ? null
                : Convert.ToBase64String(System.Security.Cryptography.ProtectedData.Protect(
                    System.Text.Encoding.UTF8.GetBytes(value.Trim()), TokenEntropy, System.Security.Cryptography.DataProtectionScope.CurrentUser));
        }
    }

    private static readonly byte[] TokenEntropy = System.Text.Encoding.UTF8.GetBytes("JellyDrax.UpdateToken");

    public bool IsCertificateTrusted(string host) =>
        TrustedCertificateHosts.Any(h => string.Equals(h, host, StringComparison.OrdinalIgnoreCase));

    public void TrustCertificate(string host)
    {
        if (!IsCertificateTrusted(host))
            TrustedCertificateHosts.Add(host);
    }
}
