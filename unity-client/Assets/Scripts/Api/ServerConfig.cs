namespace HijackPoker.Api
{
    /// <summary>
    /// Central server URL config. In WebGL builds served from the gateway,
    /// URLs are derived from the page origin (same-origin /api and /ws).
    /// In Editor and standalone builds, uses localhost with direct ports.
    /// </summary>
    public static class ServerConfig
    {
        private const string LanHost = "10.10.0.32";

#if UNITY_WEBGL && !UNITY_EDITOR
        public static string HttpBaseUrl
        {
            get
            {
                var uri = new System.Uri(UnityEngine.Application.absoluteURL);
                return $"{uri.Scheme}://{uri.Authority}/api";
            }
        }

        public static string WsBaseUrl
        {
            get
            {
                var uri = new System.Uri(UnityEngine.Application.absoluteURL);
                string ws = uri.Scheme == "https" ? "wss" : "ws";
                return $"{ws}://{uri.Authority}/ws";
            }
        }
#else
        private const string Host = "localhost";

        /// <summary>Poker engine (holdem-processor). Matches <c>HOLDEM_PROCESSOR_PORT</c> / docker-compose.</summary>
        public const string HttpBaseUrl = "http://" + Host + ":3030";
        public const string WsBaseUrl   = "ws://"   + Host + ":3032";

        /// <summary>Rewards REST API (JWT). Matches <c>REWARDS_API_PORT</c> default 5000. Same host as WebGL page if you reverse-proxy <c>/api/v1</c> to rewards-api.</summary>
        public const string RewardsHttpBaseUrl = "http://" + Host + ":5000";
#endif

#if UNITY_WEBGL && !UNITY_EDITOR
        /// <summary>Rewards API origin when the game and rewards share one HTTPS host (gateway proxies /api/v1 to rewards-api).</summary>
        public static string RewardsHttpBaseUrl
        {
            get
            {
                var uri = new System.Uri(UnityEngine.Application.absoluteURL);
                return $"{uri.Scheme}://{uri.Authority}";
            }
        }
#endif
    }
}
