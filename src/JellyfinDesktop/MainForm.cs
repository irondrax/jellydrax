using System.Diagnostics;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text.Json;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace JellyfinDesktop;

/// <summary>
/// Hauptfenster: ein WebView2 (Microsoft Edge/Chromium), das das Web-Interface
/// direkt vom Jellyfin-Server lädt (&lt;server&gt;/web/). Dadurch werden Server-Plugins,
/// Branding-/Custom-CSS, Themes und JavaScript-Erweiterungen genau so ausgeführt
/// wie in einem normalen Browser.
/// </summary>
public sealed class MainForm : Form
{
    private static readonly Color Background = Color.FromArgb(16, 16, 16);

    private readonly WebView2 _web = new() { Dock = DockStyle.Fill, DefaultBackgroundColor = Background };
    private readonly AppSettings _settings;
    private readonly string? _startServer;
    private readonly string _pageTemplate;

    private CoreWebView2? _core;
    private bool _pendingLocalPage;
    private bool _onLocalPage;
    private CancellationTokenSource? _probeCts;

    // Vollbild
    private bool _fullscreen;          // Fenster ist aktuell im Vollbild
    private bool _userFullscreen;      // per F11 angefordert (bleibt nach Video-Vollbild erhalten)
    private FormWindowState _restoreState;
    private FormBorderStyle _restoreBorder;

    public MainForm(string? startServer, bool reset)
    {
        _settings = AppSettings.Load();
        if (reset)
        {
            _settings.ServerUrl = null;
            _settings.Save();
        }
        _startServer = startServer;
        _pageTemplate = LoadPageTemplate();

        Text = "Jellyfin";
        BackColor = Background;
        MinimumSize = new Size(640, 400);
        try { Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); } catch { /* ignorieren */ }

        RestoreWindowBounds();
        Controls.Add(_web);
    }

    // ------------------------------------------------------------------ Start

    protected override async void OnLoad(EventArgs e)
    {
        base.OnLoad(e);
        await InitializeWebViewAsync();
    }

    private async Task InitializeWebViewAsync()
    {
        try
        {
            CoreWebView2Environment.GetAvailableBrowserVersionString();
        }
        catch (WebView2RuntimeNotFoundException)
        {
            var answer = MessageBox.Show(this,
                "Die Microsoft Edge WebView2 Runtime wurde nicht gefunden.\n\n" +
                "Unter Windows 11 ist sie normalerweise vorinstalliert. Jetzt die Download-Seite öffnen?",
                "Jellyfin", MessageBoxButtons.YesNo, MessageBoxIcon.Error);
            if (answer == DialogResult.Yes)
                OpenExternal("https://developer.microsoft.com/microsoft-edge/webview2/");
            Close();
            return;
        }

        var options = new CoreWebView2EnvironmentOptions(
            // "Nächste Folge" & Hintergrundmusik sollen ohne Klick starten dürfen
            additionalBrowserArguments: "--autoplay-policy=no-user-gesture-required");
        var env = await CoreWebView2Environment.CreateAsync(
            browserExecutableFolder: null,
            userDataFolder: Path.Combine(AppSettings.DataDir, "WebView2"),
            options: options);

        await _web.EnsureCoreWebView2Async(env);
        _core = _web.CoreWebView2;

        var s = _core.Settings;
        s.IsStatusBarEnabled = false;
        s.AreDevToolsEnabled = true;
        s.AreDefaultContextMenusEnabled = true;
        s.IsZoomControlEnabled = true;
        s.IsPasswordAutosaveEnabled = true;
        s.IsGeneralAutofillEnabled = true;
        s.AreBrowserAcceleratorKeysEnabled = true;

        _core.ContainsFullScreenElementChanged += (_, _) => OnElementFullscreenChanged();
        _core.NewWindowRequested += OnNewWindowRequested;
        _core.NavigationStarting += OnNavigationStarting;
        _core.NavigationCompleted += OnNavigationCompleted;
        _core.WebMessageReceived += OnWebMessageReceived;
        _core.DocumentTitleChanged += (_, _) => UpdateTitle();
        _core.ServerCertificateErrorDetected += OnServerCertificateError;

        _web.ZoomFactor = Math.Clamp(_settings.Zoom, 0.25, 5.0);

        if (!string.IsNullOrWhiteSpace(_startServer))
            ShowConnectPage(_startServer, autoConnect: true);
        else if (!string.IsNullOrWhiteSpace(_settings.ServerUrl))
            GoToServer();
        else
            ShowConnectPage();
    }

    // ------------------------------------------------------------- Navigation

    private void GoToServer()
    {
        if (_core == null) return;
        if (string.IsNullOrWhiteSpace(_settings.ServerUrl))
        {
            ShowConnectPage();
            return;
        }
        // Das Web-Interface wird vom Server selbst ausgeliefert: dadurch greifen
        // dessen Plugins (z. B. JavaScript Injector, Intro Skipper, Custom Tabs)
        // und das unter "Branding" hinterlegte CSS ohne Umwege.
        _core.Navigate(_settings.ServerUrl.TrimEnd('/') + "/web/");
    }

    private void OnNavigationStarting(object? sender, CoreWebView2NavigationStartingEventArgs e)
    {
        _onLocalPage = _pendingLocalPage;
        _pendingLocalPage = false;
    }

    private void OnNavigationCompleted(object? sender, CoreWebView2NavigationCompletedEventArgs e)
    {
        UpdateTitle();
        if (e.IsSuccess || _onLocalPage) return;

        var status = e.WebErrorStatus;
        if (status is CoreWebView2WebErrorStatus.OperationCanceled or CoreWebView2WebErrorStatus.ConnectionAborted)
            return; // abgebrochen / in Download umgewandelt

        var isCertError = status is CoreWebView2WebErrorStatus.CertificateCommonNameIsIncorrect
            or CoreWebView2WebErrorStatus.CertificateExpired
            or CoreWebView2WebErrorStatus.ClientCertificateContainsErrors
            or CoreWebView2WebErrorStatus.CertificateRevoked
            or CoreWebView2WebErrorStatus.CertificateIsInvalid;

        string? certHost = null;
        if (isCertError && Uri.TryCreate(_core?.Source, UriKind.Absolute, out var failed))
            certHost = failed.Host;

        ShowPage(new
        {
            mode = "error",
            server = _settings.ServerUrl,
            message = DescribeError(status),
            status = status.ToString(),
            certHost,
        });
    }

    private static string DescribeError(CoreWebView2WebErrorStatus status) => status switch
    {
        CoreWebView2WebErrorStatus.HostNameNotResolved => "Der Servername konnte nicht aufgelöst werden (DNS).",
        CoreWebView2WebErrorStatus.CannotConnect or CoreWebView2WebErrorStatus.ServerUnreachable =>
            "Der Server ist nicht erreichbar. Läuft Jellyfin und ist der Rechner im Netzwerk?",
        CoreWebView2WebErrorStatus.Timeout => "Zeitüberschreitung beim Verbinden mit dem Server.",
        CoreWebView2WebErrorStatus.ConnectionReset or CoreWebView2WebErrorStatus.Disconnected =>
            "Die Verbindung wurde unterbrochen.",
        CoreWebView2WebErrorStatus.CertificateCommonNameIsIncorrect or
        CoreWebView2WebErrorStatus.CertificateExpired or
        CoreWebView2WebErrorStatus.ClientCertificateContainsErrors or
        CoreWebView2WebErrorStatus.CertificateRevoked or
        CoreWebView2WebErrorStatus.CertificateIsInvalid =>
            "Das TLS-Zertifikat des Servers ist ungültig oder selbstsigniert.",
        _ => "Die Seite konnte nicht geladen werden.",
    };

    private void OnServerCertificateError(object? sender, CoreWebView2ServerCertificateErrorDetectedEventArgs e)
    {
        if (Uri.TryCreate(e.RequestUri, UriKind.Absolute, out var uri) && _settings.IsCertificateTrusted(uri.Host))
            e.Action = CoreWebView2ServerCertificateErrorAction.AlwaysAllow;
    }

    private void OnNewWindowRequested(object? sender, CoreWebView2NewWindowRequestedEventArgs e)
    {
        if (!Uri.TryCreate(e.Uri, UriKind.Absolute, out var uri)) return;

        // Seiten des eigenen Servers dürfen ein eigenes Fenster öffnen (gleiche Anmeldung)
        if (IsServerUri(uri)) return;

        // Externe Links (IMDb, TMDB, Trailer, ...) im Standardbrowser öffnen
        e.Handled = true;
        if (uri.Scheme is "http" or "https" or "mailto")
            OpenExternal(uri.AbsoluteUri);
    }

    private bool IsServerUri(Uri uri) =>
        Uri.TryCreate(_settings.ServerUrl, UriKind.Absolute, out var server)
        && string.Equals(server.Scheme, uri.Scheme, StringComparison.OrdinalIgnoreCase)
        && string.Equals(server.Host, uri.Host, StringComparison.OrdinalIgnoreCase)
        && server.Port == uri.Port;

    private void UpdateTitle()
    {
        var title = _core?.DocumentTitle;
        Text = _onLocalPage || string.IsNullOrWhiteSpace(title) ? "Jellyfin" : title;
    }

    // ------------------------------------------------- Lokale Seiten (Verbinden/Fehler)

    private static string LoadPageTemplate()
    {
        using var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("app.html")
                           ?? throw new InvalidOperationException("Ressource app.html fehlt.");
        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }

    private void ShowPage(object state)
    {
        if (_core == null) return;
        // System.Text.Json maskiert <, > und & -> sicher innerhalb von <script>
        var html = _pageTemplate.Replace("/*__STATE__*/", "window.__STATE__ = " + JsonSerializer.Serialize(state) + ";");
        _pendingLocalPage = true;
        _core.NavigateToString(html);
    }

    private void ShowConnectPage(string? prefill = null, bool autoConnect = false, string? error = null)
    {
        ShowPage(new
        {
            mode = "connect",
            server = prefill ?? _settings.ServerUrl ?? "",
            recent = _settings.RecentServers,
            autoConnect,
            error,
            canGoBack = !string.IsNullOrWhiteSpace(_settings.ServerUrl),
        });
    }

    private async void OnWebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        // Nur Nachrichten der eigenen lokalen Seite verarbeiten, nie vom Server
        if (!_onLocalPage || e.Source.StartsWith("http", StringComparison.OrdinalIgnoreCase)) return;

        try
        {
            using var doc = JsonDocument.Parse(e.WebMessageAsJson);
            var root = doc.RootElement;
            var type = root.GetProperty("type").GetString();
            switch (type)
            {
                case "connect":
                    await ConnectAsync(
                        root.GetProperty("url").GetString() ?? "",
                        root.TryGetProperty("insecure", out var ins) && ins.GetBoolean());
                    break;
                case "cancel":
                    _probeCts?.Cancel();
                    break;
                case "retry":
                    GoToServer();
                    break;
                case "changeServer":
                    ShowConnectPage();
                    break;
                case "trustCert":
                    var host = root.GetProperty("host").GetString();
                    if (!string.IsNullOrWhiteSpace(host))
                    {
                        _settings.TrustCertificate(host);
                        _settings.Save();
                    }
                    GoToServer();
                    break;
                case "removeRecent":
                    var url = root.GetProperty("url").GetString();
                    _settings.RecentServers.RemoveAll(r => string.Equals(r, url, StringComparison.OrdinalIgnoreCase));
                    _settings.Save();
                    break;
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex);
        }
    }

    private async Task ConnectAsync(string input, bool acceptInvalidCertificate)
    {
        _probeCts?.Cancel();
        var cts = _probeCts = new CancellationTokenSource();
        try
        {
            var (info, error) = await ServerProbe.ProbeAsync(input, acceptInvalidCertificate, cts.Token);
            if (cts.IsCancellationRequested || !_onLocalPage) return;

            if (info == null)
            {
                _core?.PostWebMessageAsJson(JsonSerializer.Serialize(new { type = "connectResult", ok = false, error }));
                return;
            }

            if (acceptInvalidCertificate && Uri.TryCreate(info.BaseUrl, UriKind.Absolute, out var u))
                _settings.TrustCertificate(u.Host);
            _settings.ServerUrl = info.BaseUrl;
            _settings.AddRecent(info.BaseUrl);
            _settings.Save();

            _core?.PostWebMessageAsJson(JsonSerializer.Serialize(new
            {
                type = "connectResult", ok = true, name = info.Name, version = info.Version, url = info.BaseUrl,
            }));
            await Task.Delay(400);
            GoToServer();
        }
        catch (OperationCanceledException)
        {
            // vom Benutzer abgebrochen
        }
    }

    // ---------------------------------------------------------------- Vollbild

    private void OnElementFullscreenChanged()
    {
        // Video-Player fordert Vollbild an/beendet es
        SetWindowFullscreen(_core!.ContainsFullScreenElement || _userFullscreen);
    }

    private void ToggleFullscreen()
    {
        if (_core?.ContainsFullScreenElement == true)
        {
            _userFullscreen = false;
            _ = _core.ExecuteScriptAsync("document.exitFullscreen && document.exitFullscreen()");
            return;
        }
        _userFullscreen = !_fullscreen;
        SetWindowFullscreen(_userFullscreen);
    }

    private void SetWindowFullscreen(bool on)
    {
        if (on == _fullscreen) return;
        _fullscreen = on;
        SuspendLayout();
        if (on)
        {
            _restoreState = WindowState;
            _restoreBorder = FormBorderStyle;
            if (WindowState == FormWindowState.Maximized)
                WindowState = FormWindowState.Normal; // sonst bleibt die Taskleiste sichtbar
            FormBorderStyle = FormBorderStyle.None;
            WindowState = FormWindowState.Maximized;
        }
        else
        {
            FormBorderStyle = _restoreBorder;
            WindowState = _restoreState == FormWindowState.Minimized ? FormWindowState.Normal : _restoreState;
        }
        ResumeLayout();
    }

    // ---------------------------------------------------------- Tastenkürzel

    protected override bool ProcessCmdKey(ref Message msg, Keys keyData)
    {
        switch (keyData)
        {
            case Keys.F11:
            case Keys.Alt | Keys.Enter:
                ToggleFullscreen();
                return true;
            case Keys.Escape when _fullscreen:
                ToggleFullscreen();
                return true;
            case Keys.F5:
                if (_onLocalPage) GoToServer(); else _core?.Reload();
                return true;
            case Keys.Control | Keys.F5:
                _ = HardReloadAsync(clearCache: false);
                return true;
            case Keys.Control | Keys.Shift | Keys.S:
                ShowConnectPage();
                return true;
            case Keys.F12:
            case Keys.Control | Keys.Shift | Keys.I:
                _core?.OpenDevToolsWindow();
                return true;
        }
        return base.ProcessCmdKey(ref msg, keyData);
    }

    private async Task HardReloadAsync(bool clearCache)
    {
        if (_core == null) return;
        if (clearCache)
        {
            // Login (localStorage/Cookies) bleibt erhalten, nur zwischengespeicherte Dateien werden gelöscht –
            // hilfreich, wenn Plugins/CSS auf dem Server aktualisiert wurden.
            await _core.Profile.ClearBrowsingDataAsync(
                CoreWebView2BrowsingDataKinds.DiskCache |
                CoreWebView2BrowsingDataKinds.CacheStorage |
                CoreWebView2BrowsingDataKinds.ServiceWorkers);
        }
        if (_onLocalPage)
            GoToServer();
        else
            await _core.CallDevToolsProtocolMethodAsync("Page.reload", "{\"ignoreCache\":true}");
    }

    // --------------------------------------------- Systemmenü (Rechtsklick auf Titelleiste)

    private const int WM_SYSCOMMAND = 0x0112;
    private const uint MF_STRING = 0x0000, MF_SEPARATOR = 0x0800;
    private const int CmdChangeServer = 0x0100, CmdReload = 0x0110, CmdClearCache = 0x0120,
        CmdFullscreen = 0x0130, CmdDevTools = 0x0140, CmdAbout = 0x0150;

    [DllImport("user32.dll")]
    private static extern IntPtr GetSystemMenu(IntPtr hWnd, bool bRevert);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern bool AppendMenu(IntPtr hMenu, uint uFlags, UIntPtr uIdNewItem, string? lpNewItem);

    [DllImport("dwmapi.dll")]
    private static extern int DwmSetWindowAttribute(IntPtr hwnd, int attr, ref int attrValue, int attrSize);

    protected override void OnHandleCreated(EventArgs e)
    {
        base.OnHandleCreated(e);

        // Dunkle Titelleiste (Windows 11 / Windows 10 20H1+)
        var dark = 1;
        DwmSetWindowAttribute(Handle, 20, ref dark, sizeof(int));

        var menu = GetSystemMenu(Handle, false);
        AppendMenu(menu, MF_SEPARATOR, UIntPtr.Zero, null);
        AppendMenu(menu, MF_STRING, (UIntPtr)CmdChangeServer, "Server wechseln…\tStrg+Umschalt+S");
        AppendMenu(menu, MF_STRING, (UIntPtr)CmdReload, "Neu laden\tF5");
        AppendMenu(menu, MF_STRING, (UIntPtr)CmdClearCache, "Cache leeren und neu laden");
        AppendMenu(menu, MF_STRING, (UIntPtr)CmdFullscreen, "Vollbild\tF11");
        AppendMenu(menu, MF_STRING, (UIntPtr)CmdDevTools, "Entwicklertools\tF12");
        AppendMenu(menu, MF_SEPARATOR, UIntPtr.Zero, null);
        AppendMenu(menu, MF_STRING, (UIntPtr)CmdAbout, "Über Jellyfin Desktop");
    }

    protected override void WndProc(ref Message m)
    {
        if (m.Msg == WM_SYSCOMMAND)
        {
            switch ((int)(m.WParam.ToInt64() & 0xFFF0))
            {
                case CmdChangeServer: ShowConnectPage(); return;
                case CmdReload: if (_onLocalPage) GoToServer(); else _core?.Reload(); return;
                case CmdClearCache: _ = HardReloadAsync(clearCache: true); return;
                case CmdFullscreen: ToggleFullscreen(); return;
                case CmdDevTools: _core?.OpenDevToolsWindow(); return;
                case CmdAbout: ShowAbout(); return;
            }
        }
        base.WndProc(ref m);
    }

    private void ShowAbout()
    {
        var version = Assembly.GetExecutingAssembly().GetName().Version?.ToString(3) ?? "?";
        string runtime;
        try { runtime = CoreWebView2Environment.GetAvailableBrowserVersionString(); }
        catch { runtime = "?"; }
        MessageBox.Show(this,
            $"Jellyfin Desktop {version}\n" +
            $"WebView2 Runtime: {runtime}\n" +
            $"Server: {_settings.ServerUrl ?? "–"}\n" +
            $"Daten: {AppSettings.DataDir}\n\n" +
            "F11 Vollbild · F5 Neu laden · Strg+F5 ohne Cache\n" +
            "Strg+Umschalt+S Server wechseln · F12 Entwicklertools\n" +
            "Strg + Mausrad / Strg+0 Zoom",
            "Über Jellyfin Desktop", MessageBoxButtons.OK, MessageBoxIcon.Information);
    }

    // ------------------------------------------------------------ Fensterzustand

    private void RestoreWindowBounds()
    {
        var b = _settings.WindowBounds;
        if (b is { Length: 4 } && b[2] >= 640 && b[3] >= 400)
        {
            var rect = new Rectangle(b[0], b[1], b[2], b[3]);
            if (Screen.AllScreens.Any(s => s.WorkingArea.IntersectsWith(rect)))
            {
                StartPosition = FormStartPosition.Manual;
                Bounds = rect;
            }
        }
        else
        {
            Size = new Size(1280, 800);
            StartPosition = FormStartPosition.CenterScreen;
        }
        if (_settings.Maximized)
            WindowState = FormWindowState.Maximized;
    }

    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        _probeCts?.Cancel();
        var state = _fullscreen ? _restoreState : WindowState;
        if (_fullscreen) SetWindowFullscreen(false);

        var bounds = WindowState == FormWindowState.Normal ? Bounds : RestoreBounds;
        _settings.WindowBounds = new[] { bounds.X, bounds.Y, bounds.Width, bounds.Height };
        _settings.Maximized = state == FormWindowState.Maximized;
        if (_core != null) _settings.Zoom = _web.ZoomFactor;
        _settings.Save();
        base.OnFormClosing(e);
    }

    private static void OpenExternal(string url)
    {
        try { Process.Start(new ProcessStartInfo(url) { UseShellExecute = true }); }
        catch { /* kein Standardbrowser */ }
    }
}
