using System.Linq;
using UnityEditor;
using UnityEngine;

/// <summary>
/// WebGL IL2CPP builds strip shaders that are only resolved via Shader.Find at runtime.
/// TextMesh Pro uses Shader.Find("TextMeshPro/Mobile/Distance Field") etc. internally, so those
/// shaders must appear under Project Settings → Graphics → Always Included Shaders.
/// </summary>
public static class TextMeshProBuildSupport
{
    static readonly string[] TmpShaderNames =
    {
        "TextMeshPro/Distance Field",
        "TextMeshPro/Mobile/Distance Field",
        "TextMeshPro/Sprite",
        "TextMeshPro/Bitmap",
        "TextMeshPro/Mobile/Bitmap",
    };

    [MenuItem("Hijack Poker/Rendering/Include TextMesh Pro shaders for WebGL")]
    public static void MenuEnsureAlwaysIncludedShaders()
    {
        EnsureAlwaysIncludedShaders();
    }

    public static void EnsureAlwaysIncludedShaders()
    {
        var graphicsObj = AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/GraphicsSettings.asset").FirstOrDefault();
        if (graphicsObj == null)
        {
            Debug.LogError("TextMeshProBuildSupport: could not load ProjectSettings/GraphicsSettings.asset");
            return;
        }

        var serializedObject = new SerializedObject(graphicsObj);
        var shadersProperty = serializedObject.FindProperty("m_AlwaysIncludedShaders");
        if (shadersProperty == null)
        {
            Debug.LogError("TextMeshProBuildSupport: m_AlwaysIncludedShaders missing");
            return;
        }

        var added = 0;
        foreach (var shaderName in TmpShaderNames)
        {
            var shader = Shader.Find(shaderName);
            if (shader == null)
            {
                Debug.LogWarning(
                    $"TextMeshProBuildSupport: shader not found (import TMP Essentials first): {shaderName}");
                continue;
            }

            var already = false;
            for (var i = 0; i < shadersProperty.arraySize; i++)
            {
                if (shadersProperty.GetArrayElementAtIndex(i).objectReferenceValue == shader)
                {
                    already = true;
                    break;
                }
            }

            if (already) continue;

            var idx = shadersProperty.arraySize;
            shadersProperty.InsertArrayElementAtIndex(idx);
            shadersProperty.GetArrayElementAtIndex(idx).objectReferenceValue = shader;
            added++;
        }

        serializedObject.ApplyModifiedProperties();
        AssetDatabase.SaveAssets();

        if (added > 0)
            Debug.Log($"TextMeshProBuildSupport: added {added} shader(s) to Always Included Shaders.");
    }
}
