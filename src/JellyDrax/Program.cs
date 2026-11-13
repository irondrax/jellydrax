namespace JellyDrax;

internal static class Program
{
    /// <summary>
    /// Aufruf: JellyDrax.exe [--server &lt;url&gt;] [--reset]
    ///   --server  verbindet direkt mit dem angegebenen Server (und speichert ihn)
    ///   --reset   vergisst den gespeicherten Server und zeigt den Verbindungsdialog
    /// </summary>
    [STAThread]
    private static void Main(string[] args)
    {
        string? server = null;
        var reset = false;
        for (var i = 0; i < args.Length; i++)
        {
            switch (args[i].ToLowerInvariant())
            {
                case "--server" when i + 1 < args.Length:
                    server = args[++i];
                    break;
                case "--reset":
                    reset = true;
                    break;
            }
        }

        ApplicationConfiguration.Initialize();
        Application.Run(new MainForm(server, reset));
    }
}
