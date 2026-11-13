; Installer für JellyDrax
; Bauen:  makensis -DVERSION=2.3.0 installer/JellyDrax.nsi
; Erwartet die veröffentlichte EXE unter dist\JellyDrax.exe

Unicode true
SetCompressor /SOLID lzma
RequestExecutionLevel user          ; Installation pro Benutzer, keine Administratorrechte nötig

!ifndef VERSION
  !define VERSION "2.3.0"
!endif
!define APPNAME      "JellyDrax"
!define EXENAME      "JellyDrax.exe"
!define UNINSTKEY    "Software\Microsoft\Windows\CurrentVersion\Uninstall\JellyDrax"
!define OLDUNINSTKEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\JellyfinDesktop"
!define WEBVIEW2GUID "{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"

Name "${APPNAME}"
OutFile "..\dist\JellyDrax-Setup-${VERSION}.exe"
InstallDir "$LOCALAPPDATA\Programs\${APPNAME}"
InstallDirRegKey HKCU "${UNINSTKEY}" "InstallLocation"
BrandingText "${APPNAME} ${VERSION}"

VIProductVersion "${VERSION}.0"
VIAddVersionKey /LANG=1031 "ProductName" "${APPNAME}"
VIAddVersionKey /LANG=1031 "FileDescription" "${APPNAME} Setup"
VIAddVersionKey /LANG=1031 "FileVersion" "${VERSION}"
VIAddVersionKey /LANG=1031 "ProductVersion" "${VERSION}"
VIAddVersionKey /LANG=1031 "LegalCopyright" ""

!include "MUI2.nsh"
!include "LogicLib.nsh"

!define MUI_ICON   "..\src\JellyDrax\Assets\app.ico"
!define MUI_UNICON "..\src\JellyDrax\Assets\app.ico"
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TEXT "Dieser Assistent installiert ${APPNAME} ${VERSION} – einen Jellyfin-Client mit eigenem Design, Themes und Media Bar.$\r$\n$\r$\nEine vorhandene Installation von $\"Jellyfin Desktop$\" wird dabei ersetzt; Server, Anmeldung und Einstellungen bleiben erhalten.$\r$\n$\r$\nKlicken Sie auf Weiter, um fortzufahren."
!define MUI_FINISHPAGE_RUN "$INSTDIR\${EXENAME}"
!define MUI_FINISHPAGE_RUN_TEXT "${APPNAME} jetzt starten"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "German"

; ------------------------------------------------------------------ Installation

Section "${APPNAME} (erforderlich)" SecMain
  SectionIn RO
  SetOutPath "$INSTDIR"

  ; Läuft die App noch? Dann lässt sich die EXE nicht ersetzen.
  retry:
    ClearErrors
    ${If} ${FileExists} "$INSTDIR\${EXENAME}"
      Delete "$INSTDIR\${EXENAME}"
      ${If} ${Errors}
        MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION \
          "${APPNAME} läuft noch. Bitte das Programm schließen und auf $\"Wiederholen$\" klicken." \
          IDRETRY retry
        Abort
      ${EndIf}
    ${EndIf}

  ; Vorgängerversion "Jellyfin Desktop" still entfernen (Daten bleiben erhalten
  ; und werden von JellyDrax beim ersten Start übernommen)
  ReadRegStr $0 HKCU "${OLDUNINSTKEY}" "InstallLocation"
  ${If} $0 != ""
  ${AndIf} ${FileExists} "$0\Uninstall.exe"
    DetailPrint "Entferne Jellyfin Desktop …"
    ExecWait '"$0\Uninstall.exe" /S _?=$0'
    Delete "$0\Uninstall.exe"
    RMDir "$0"
  ${EndIf}

  File "..\dist\${EXENAME}"
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  ; Startmenü
  CreateShortCut "$SMPROGRAMS\${APPNAME}.lnk" "$INSTDIR\${EXENAME}" "" "$INSTDIR\${EXENAME}" 0 \
    SW_SHOWNORMAL "" "Jellyfin-Client"

  ; Eintrag unter "Installierte Apps"
  WriteRegStr   HKCU "${UNINSTKEY}" "DisplayName"          "${APPNAME}"
  WriteRegStr   HKCU "${UNINSTKEY}" "DisplayVersion"       "${VERSION}"
  WriteRegStr   HKCU "${UNINSTKEY}" "Publisher"            "${APPNAME}"
  WriteRegStr   HKCU "${UNINSTKEY}" "DisplayIcon"          "$INSTDIR\${EXENAME}"
  WriteRegStr   HKCU "${UNINSTKEY}" "InstallLocation"      "$INSTDIR"
  WriteRegStr   HKCU "${UNINSTKEY}" "UninstallString"      "$\"$INSTDIR\Uninstall.exe$\""
  WriteRegStr   HKCU "${UNINSTKEY}" "QuietUninstallString" "$\"$INSTDIR\Uninstall.exe$\" /S"
  WriteRegDWORD HKCU "${UNINSTKEY}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINSTKEY}" "NoRepair" 1
  WriteRegDWORD HKCU "${UNINSTKEY}" "EstimatedSize" 68000
SectionEnd

Section "Verknüpfung auf dem Desktop" SecDesktop
  CreateShortCut "$DESKTOP\${APPNAME}.lnk" "$INSTDIR\${EXENAME}" "" "$INSTDIR\${EXENAME}" 0
SectionEnd

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SecMain}    "Programmdateien und Eintrag im Startmenü."
  !insertmacro MUI_DESCRIPTION_TEXT ${SecDesktop} "Legt eine Verknüpfung auf dem Desktop an."
!insertmacro MUI_FUNCTION_DESCRIPTION_END

; Nach der Installation prüfen, ob die WebView2 Runtime vorhanden ist (in Windows 11 Standard)
Function .onInstSuccess
  ReadRegStr $0 HKLM "SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\${WEBVIEW2GUID}" "pv"
  ${If} $0 == ""
  ${OrIf} $0 == "0.0.0.0"
    ReadRegStr $0 HKCU "Software\Microsoft\EdgeUpdate\Clients\${WEBVIEW2GUID}" "pv"
  ${EndIf}
  ${If} $0 == ""
  ${OrIf} $0 == "0.0.0.0"
    IfSilent done
    MessageBox MB_YESNO|MB_ICONINFORMATION \
      "Die Microsoft Edge WebView2 Runtime wurde nicht gefunden. Sie wird für ${APPNAME} benötigt.$\n$\nDownload-Seite jetzt öffnen?" \
      IDNO done
    ExecShell "open" "https://developer.microsoft.com/microsoft-edge/webview2/"
  ${EndIf}
  done:
FunctionEnd

; ---------------------------------------------------------------- Deinstallation

Section "Uninstall"
  Delete "$INSTDIR\${EXENAME}"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir  "$INSTDIR"

  Delete "$SMPROGRAMS\${APPNAME}.lnk"
  Delete "$DESKTOP\${APPNAME}.lnk"
  DeleteRegKey HKCU "${UNINSTKEY}"

  ; Anmeldung, Einstellungen, Design und Browser-Cache optional entfernen
  IfSilent keepdata
  MessageBox MB_YESNO|MB_ICONQUESTION|MB_DEFBUTTON2 \
    "Auch die gespeicherten Daten löschen (Serveradresse, Anmeldung, Design-Einstellungen, Cache)?" \
    IDNO keepdata
  RMDir /r "$LOCALAPPDATA\JellyDrax"
  keepdata:
SectionEnd
