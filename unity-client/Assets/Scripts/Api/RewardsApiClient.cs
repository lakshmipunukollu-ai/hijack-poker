using System;
using System.Text;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;
using Newtonsoft.Json;
using HijackPoker.Models;

namespace HijackPoker.Api
{
    /// <summary>
    /// HTTP client for rewards-api (port 5000 locally). Obtains JWT via POST /api/v1/auth/token
    /// then calls GET /api/v1/player/rewards. Use the same <see cref="PlayerId"/> as the web dashboard.
    /// </summary>
    public class RewardsApiClient : MonoBehaviour
    {
        [Tooltip("Base URL without trailing slash, e.g. http://localhost:5000")]
        [SerializeField] private string rewardsBaseUrl = ServerConfig.RewardsHttpBaseUrl;

        [Tooltip("Must match the player you log in with on the rewards dashboard. Overridden in WebGL by the ?player= query param on the loader URL.")]
        [SerializeField] private string playerId = "player-001";

        [SerializeField] private float timeoutSeconds = 8f;

        private string _jwt;
        private double _jwtExpiresAtUnix;
        private string _dashboardBaseUrl;

        public string PlayerId => playerId;

        /// <summary>
        /// Optional base URL of the React rewards dashboard, injected via <c>?dashboard=</c> when embedded in the <c>/table</c> iframe.
        /// Can be used to open the full rewards dashboard in a new browser tab.
        /// </summary>
        public string DashboardBaseUrl => _dashboardBaseUrl;

        private void Awake()
        {
#if UNITY_WEBGL && !UNITY_EDITOR
            if (!string.IsNullOrEmpty(Application.absoluteURL) &&
                WebGlLaunchParams.TryParse(Application.absoluteURL, out var p, out var rewards, out var dash))
            {
                if (!string.IsNullOrEmpty(p))
                    playerId = p;
                if (!string.IsNullOrEmpty(rewards))
                    rewardsBaseUrl = rewards;
                if (!string.IsNullOrEmpty(dash))
                    _dashboardBaseUrl = dash;
            }
#endif
        }

        public async Task<PlayerRewardsResponse> GetPlayerRewardsAsync()
        {
            if (string.IsNullOrEmpty(rewardsBaseUrl))
            {
                Debug.LogWarning("RewardsApiClient: rewardsBaseUrl is empty.");
                return null;
            }

            try
            {
                await EnsureTokenAsync();
                if (string.IsNullOrEmpty(_jwt))
                    return null;

                string url = rewardsBaseUrl.TrimEnd('/') + "/api/v1/player/rewards";
                using var request = UnityWebRequest.Get(url);
                request.timeout = (int)timeoutSeconds;
                request.SetRequestHeader("Accept", "application/json");
                request.SetRequestHeader("Authorization", "Bearer " + _jwt);

                await SendRequest(request);

                if (request.result != UnityWebRequest.Result.Success)
                {
                    Debug.LogWarning($"Rewards GET /player/rewards failed: {request.responseCode} {request.error}");
                    return null;
                }

                string json = request.downloadHandler.text;
                return JsonConvert.DeserializeObject<PlayerRewardsResponse>(json);
            }
            catch (Exception e)
            {
                Debug.LogWarning($"RewardsApiClient: {e.Message}");
                return null;
            }
        }

        private async Task EnsureTokenAsync()
        {
            double now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            if (!string.IsNullOrEmpty(_jwt) && now < _jwtExpiresAtUnix - 120)
                return;

            _jwt = null;
            string url = rewardsBaseUrl.TrimEnd('/') + "/api/v1/auth/token";
            string jsonBody = JsonConvert.SerializeObject(new { playerId });
            byte[] bodyBytes = Encoding.UTF8.GetBytes(jsonBody);

            using var request = new UnityWebRequest(url, "POST");
            request.uploadHandler = new UploadHandlerRaw(bodyBytes);
            request.downloadHandler = new DownloadHandlerBuffer();
            request.timeout = (int)timeoutSeconds;
            request.SetRequestHeader("Content-Type", "application/json");
            request.SetRequestHeader("Accept", "application/json");

            await SendRequest(request);

            if (request.result != UnityWebRequest.Result.Success)
            {
                Debug.LogWarning(
                    $"Rewards POST /auth/token failed: {request.responseCode} — is rewards-api running (e.g. docker compose --profile rewards)?");
                return;
            }

            var tokenRes = JsonConvert.DeserializeObject<RewardsTokenResponse>(request.downloadHandler.text);
            if (tokenRes?.Token == null)
                return;

            _jwt = tokenRes.Token;
            int ttl = Math.Max(300, tokenRes.ExpiresInSeconds);
            _jwtExpiresAtUnix = now + ttl;
        }

        private static Task SendRequest(UnityWebRequest request)
        {
            var tcs = new TaskCompletionSource<bool>();
            var op = request.SendWebRequest();
            op.completed += _ => tcs.TrySetResult(true);
            return tcs.Task;
        }
    }
}
