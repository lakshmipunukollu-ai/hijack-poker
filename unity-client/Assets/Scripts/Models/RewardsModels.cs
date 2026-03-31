using Newtonsoft.Json;

namespace HijackPoker.Models
{
    public class RewardsTokenResponse
    {
        [JsonProperty("token")]
        public string Token { get; set; }

        [JsonProperty("expiresIn")]
        public int ExpiresInSeconds { get; set; }
    }

    /// <summary>GET /api/v1/player/rewards — aligns with rewards-api player route.</summary>
    public class PlayerRewardsResponse
    {
        [JsonProperty("playerId")]
        public string PlayerId { get; set; }

        [JsonProperty("tier")]
        public string Tier { get; set; }

        [JsonProperty("multiplier")]
        public double Multiplier { get; set; }

        [JsonProperty("monthlyPoints")]
        public int MonthlyPoints { get; set; }

        [JsonProperty("lifetimePoints")]
        public int LifetimePoints { get; set; }

        [JsonProperty("nextTierAt")]
        public int? NextTierAt { get; set; }

        [JsonProperty("nextTierName")]
        public string NextTierName { get; set; }
    }
}
