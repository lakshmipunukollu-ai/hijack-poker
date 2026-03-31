using System.Collections;
using System.Threading.Tasks;
using TMPro;
using UnityEngine;
using UnityEngine.UI;
using HijackPoker.Api;
using HijackPoker.Models;

namespace HijackPoker.UI
{
    /// <summary>
    /// Top-right rewards panel: large monthly points with tier and details (easier to read at a glance).
    /// </summary>
    public class RewardsStatusStrip : MonoBehaviour
    {
        private RewardsApiClient _client;
        private TextMeshProUGUI _tierText;
        private TextMeshProUGUI _pointsText;
        private TextMeshProUGUI _detailText;
        private Coroutine _poll;

        public static RewardsStatusStrip Create(Transform parent, RewardsApiClient client)
        {
            var go = new GameObject("RewardsStatus", typeof(RectTransform));
            go.transform.SetParent(parent, false);
            var rt = go.GetComponent<RectTransform>();
            rt.anchorMin = new Vector2(1f, 1f);
            rt.anchorMax = new Vector2(1f, 1f);
            rt.pivot = new Vector2(1f, 1f);
            rt.anchoredPosition = new Vector2(-6, -34);
            rt.sizeDelta = new Vector2(288, 108);

            var bg = go.AddComponent<Image>();
            bg.color = new Color(0.06f, 0.08f, 0.14f, 0.93f);
            bg.sprite = TextureGenerator.GetRoundedRect(288, 108, 14);
            bg.type = Image.Type.Sliced;
            bg.raycastTarget = false;

            var pad = new GameObject("Pad", typeof(RectTransform));
            pad.transform.SetParent(go.transform, false);
            UIFactory.StretchFill(pad.GetComponent<RectTransform>(), 10);
            var vlg = pad.AddComponent<VerticalLayoutGroup>();
            vlg.spacing = 2;
            vlg.padding = new RectOffset(4, 4, 2, 2);
            vlg.childAlignment = TextAnchor.UpperRight;

            var view = go.AddComponent<RewardsStatusStrip>();
            view._client = client;

            view._tierText = UIFactory.CreateText("TierLine", pad.transform, "REWARDS",
                12f, UIFactory.AccentGold, TextAlignmentOptions.Right, FontStyles.Bold);
            var tLE = view._tierText.gameObject.AddComponent<LayoutElement>();
            tLE.preferredHeight = 16;

            view._pointsText = UIFactory.CreateText("PointsLine", pad.transform, "…",
                30f, UIFactory.TextBright, TextAlignmentOptions.Right, FontStyles.Bold);
            view._pointsText.enableAutoSizing = true;
            view._pointsText.fontSizeMin = 20f;
            view._pointsText.fontSizeMax = 34f;
            view._pointsText.overflowMode = TextOverflowModes.Overflow;
            var pLE = view._pointsText.gameObject.AddComponent<LayoutElement>();
            pLE.preferredHeight = 38;

            view._detailText = UIFactory.CreateText("DetailLine", pad.transform, "",
                11f, new Color(0.72f, 0.76f, 0.84f, 0.92f), TextAlignmentOptions.Right);
            view._detailText.enableWordWrapping = true;
            var dLE = view._detailText.gameObject.AddComponent<LayoutElement>();
            dLE.minHeight = 36;
            dLE.flexibleWidth = 1;

            return view;
        }

        private void OnEnable()
        {
            if (_client != null)
                _poll = StartCoroutine(PollLoop());
        }

        private void OnDisable()
        {
            if (_poll != null)
            {
                StopCoroutine(_poll);
                _poll = null;
            }
        }

        private IEnumerator PollLoop()
        {
            while (enabled && _client != null)
            {
                var t = _client.GetPlayerRewardsAsync();
                while (!t.IsCompleted) yield return null;

                var data = t.Status == TaskStatus.RanToCompletion ? t.Result : null;
                Apply(data);
                yield return new WaitForSeconds(60f);
            }
        }

        private void Apply(PlayerRewardsResponse data)
        {
            if (_tierText == null) return;

            if (data == null)
            {
                _tierText.text = "REWARDS";
                _pointsText.text = "Offline";
                _detailText.text = "Start rewards API (port 5000)";
                return;
            }

            _tierText.text = string.IsNullOrEmpty(data.Tier)
                ? "TIER"
                : data.Tier.ToUpperInvariant();
            _pointsText.text = $"{data.MonthlyPoints:N0}";

            string mult = data.Multiplier % 1 == 0
                ? $"{(int)data.Multiplier}×"
                : $"{data.Multiplier:0.#}×";
            _detailText.text =
                $"points this month · {mult} mult\nLifetime {data.LifetimePoints:N0} pts";
        }
    }
}
