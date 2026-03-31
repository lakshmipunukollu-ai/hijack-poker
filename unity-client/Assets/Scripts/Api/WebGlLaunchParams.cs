using System;

namespace HijackPoker.Api
{
    /// <summary>
    /// Parses optional query parameters when the WebGL build is loaded (e.g. from the React <c>/table</c> iframe).
    /// Same convention as <c>ui/index.html</c> / README: <c>player</c>, <c>rewardsApi</c>, <c>dashboard</c>.
    /// </summary>
    public static class WebGlLaunchParams
    {
        /// <summary>
        /// Try to parse <c>player</c>, <c>rewardsApi</c>, and <c>dashboard</c> from the loader URL.
        /// </summary>
        /// <param name="absoluteUrl">Value of <c>Application.absoluteURL</c> in a WebGL build.</param>
        /// <param name="playerId">Parsed player id, or <c>null</c>.</param>
        /// <param name="rewardsApiBase">Parsed rewards API base URL (trailing slash stripped), or <c>null</c>.</param>
        /// <param name="dashboardBase">Parsed React dashboard base URL (trailing slash stripped), or <c>null</c>.</param>
        /// <returns><c>true</c> when at least one param was found.</returns>
        public static bool TryParse(
            string absoluteUrl,
            out string playerId,
            out string rewardsApiBase,
            out string dashboardBase)
        {
            playerId = null;
            rewardsApiBase = null;
            dashboardBase = null;
            if (string.IsNullOrEmpty(absoluteUrl))
                return false;

            try
            {
                var uri = new Uri(absoluteUrl);
                var query = uri.Query;
                if (string.IsNullOrEmpty(query) || query.Length < 2)
                    return false;

                foreach (var part in query.Substring(1).Split('&'))
                {
                    var eq = part.IndexOf('=');
                    if (eq <= 0)
                        continue;

                    var key = Uri.UnescapeDataString(part.Substring(0, eq));
                    var val = Uri.UnescapeDataString(part.Substring(eq + 1));

                    switch (key)
                    {
                        case "player":
                            if (!string.IsNullOrEmpty(val))
                                playerId = val;
                            break;
                        case "rewardsApi":
                            if (!string.IsNullOrEmpty(val))
                                rewardsApiBase = val.TrimEnd('/');
                            break;
                        case "dashboard":
                            if (!string.IsNullOrEmpty(val))
                                dashboardBase = val.TrimEnd('/');
                            break;
                    }
                }

                return playerId != null || rewardsApiBase != null || dashboardBase != null;
            }
            catch (UriFormatException)
            {
                return false;
            }
        }
    }
}
