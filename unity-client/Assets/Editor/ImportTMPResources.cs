using System.IO;
using UnityEditor;
using UnityEngine;

/// <summary>
/// Imports TMP Essential Resources from the bundled com.unity.ugui package when missing.
/// Fonts, TMP Settings, and default materials must exist for player builds (especially WebGL).
/// </summary>
public static class ImportTMPResources
{
    private const string TmpSettingsAssetPath = "Assets/TextMesh Pro/Resources/TMP Settings.asset";

    /// <summary>
    /// Imports the unitypackage if TMP Settings are not present. Safe to call before every WebGL build.
    /// </summary>
    public static bool EnsureImportedForBuild()
    {
        if (AssetDatabase.LoadAssetAtPath<Object>(TmpSettingsAssetPath) != null)
            return true;

        var packagePath = FindTmpEssentialsPackagePath();
        if (string.IsNullOrEmpty(packagePath))
        {
            Debug.LogError(
                "ImportTMPResources: TMP Essential Resources.unitypackage not found. " +
                "Expected Library/PackageCache/com.unity.ugui*/Package Resources/");
            return false;
        }

        Debug.Log($"ImportTMPResources: importing {packagePath}");
        AssetDatabase.ImportPackage(packagePath, false);
        AssetDatabase.Refresh(ImportAssetOptions.ForceUpdate);

        if (AssetDatabase.LoadAssetAtPath<Object>(TmpSettingsAssetPath) == null)
        {
            Debug.LogError("ImportTMPResources: import completed but TMP Settings.asset is still missing.");
            return false;
        }

        Debug.Log("ImportTMPResources: TMP Essential Resources imported.");
        return true;
    }

    static string FindTmpEssentialsPackagePath()
    {
        if (!Directory.Exists("Library/PackageCache"))
            return null;

        foreach (var dir in Directory.GetDirectories("Library/PackageCache", "com.unity.ugui*"))
        {
            var candidate = Path.Combine(dir, "Package Resources", "TMP Essential Resources.unitypackage");
            if (File.Exists(candidate))
                return Path.GetFullPath(candidate);
        }

        return null;
    }

    /// <summary>Batch / CI: -executeMethod ImportTMPResources.ImportFromCommandLine</summary>
    public static void ImportFromCommandLine()
    {
        if (!EnsureImportedForBuild())
            EditorApplication.Exit(1);
        else
            EditorApplication.Exit(0);
    }
}
