using System.Text.Json;

namespace JellyfinDesktop;

public sealed class AppSettings
{
    public string? ServerUrl { get; set; }
    public List<string> RecentServers { get; set; } = new();
    /// <summary>Hosts, deren (z. B. selbstsignierte) Zertifikate akzeptiert werden.</summary>
    public List<string> TrustedCertificateHosts { get; set; } = new();
    public int[]? WindowBounds { get; set; }
    public bool Maximized { get; set; }
    public double Zoom { get; set; } = 1.0;

    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };

    /// <summary>
    /// Standard: %LOCALAPPDATA%\JellyfinDesktop.
    /// Portabler Modus: liegt neben der EXE eine Datei "portable.txt", wird ".\data" verwendet.
    /// </summary>
    public static string DataDir { get; } = ResolveDataDir();

    private static string FilePath => Path.Combine(DataDir, "settings.json");

    private static string ResolveDataDir()
    {
        var exeDir = AppContext.BaseDirectory;
        if (File.Exists(Path.Combine(exeDir, "portable.txt")))
            return Path.Combine(exeDir, "data");
        return Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "JellyfinDesktop");
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

    public bool IsCertificateTrusted(string host) =>
        TrustedCertificateHosts.Any(h => string.Equals(h, host, StringComparison.OrdinalIgnoreCase));

    public void TrustCertificate(string host)
    {
        if (!IsCertificateTrusted(host))
            TrustedCertificateHosts.Add(host);
    }
}
