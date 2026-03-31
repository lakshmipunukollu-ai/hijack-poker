using NUnit.Framework;
using HijackPoker.Api;

namespace HijackPoker.Tests
{
    [TestFixture]
    public class WebGlLaunchParamsTests
    {
        // ── Null / empty guards ──────────────────────────────────────

        [Test]
        public void TryParse_NullUrl_ReturnsFalse()
        {
            var result = WebGlLaunchParams.TryParse(null, out var p, out var r, out var d);
            Assert.IsFalse(result);
            Assert.IsNull(p);
            Assert.IsNull(r);
            Assert.IsNull(d);
        }

        [Test]
        public void TryParse_EmptyUrl_ReturnsFalse()
        {
            var result = WebGlLaunchParams.TryParse("", out var p, out var r, out var d);
            Assert.IsFalse(result);
        }

        [Test]
        public void TryParse_NoQueryString_ReturnsFalse()
        {
            var result = WebGlLaunchParams.TryParse("http://localhost:8090/", out var p, out var r, out var d);
            Assert.IsFalse(result);
            Assert.IsNull(p);
        }

        [Test]
        public void TryParse_EmptyQueryString_ReturnsFalse()
        {
            var result = WebGlLaunchParams.TryParse("http://localhost:8090/?", out var p, out var r, out var d);
            Assert.IsFalse(result);
        }

        // ── All three params ─────────────────────────────────────────

        [Test]
        public void TryParse_AllParams_ParsedCorrectly()
        {
            const string url = "http://localhost:8090/?player=player-001&rewardsApi=http://localhost:5000&dashboard=http://localhost:4000";
            var result = WebGlLaunchParams.TryParse(url, out var p, out var r, out var d);

            Assert.IsTrue(result);
            Assert.AreEqual("player-001", p);
            Assert.AreEqual("http://localhost:5000", r);
            Assert.AreEqual("http://localhost:4000", d);
        }

        // ── Partial params ───────────────────────────────────────────

        [Test]
        public void TryParse_PlayerOnly_ReturnsTrue()
        {
            const string url = "http://localhost:8090/?player=alice-99";
            var result = WebGlLaunchParams.TryParse(url, out var p, out var r, out var d);

            Assert.IsTrue(result);
            Assert.AreEqual("alice-99", p);
            Assert.IsNull(r);
            Assert.IsNull(d);
        }

        [Test]
        public void TryParse_RewardsApiOnly_ReturnsTrue()
        {
            const string url = "http://localhost:8090/?rewardsApi=http://localhost:5500";
            var result = WebGlLaunchParams.TryParse(url, out var p, out var r, out var d);

            Assert.IsTrue(result);
            Assert.IsNull(p);
            Assert.AreEqual("http://localhost:5500", r);
            Assert.IsNull(d);
        }

        // ── Trailing slash stripped from URLs ────────────────────────

        [Test]
        public void TryParse_TrailingSlashOnRewardsApi_IsStripped()
        {
            const string url = "http://localhost:8090/?rewardsApi=http://localhost:5000/";
            WebGlLaunchParams.TryParse(url, out _, out var r, out _);
            Assert.AreEqual("http://localhost:5000", r);
        }

        [Test]
        public void TryParse_TrailingSlashOnDashboard_IsStripped()
        {
            const string url = "http://localhost:8090/?dashboard=http://localhost:4000/";
            WebGlLaunchParams.TryParse(url, out _, out _, out var d);
            Assert.AreEqual("http://localhost:4000", d);
        }

        // ── Percent-encoded values ───────────────────────────────────

        [Test]
        public void TryParse_EncodedPlayerParam_Decoded()
        {
            const string url = "http://localhost:8090/?player=player%2D001";
            WebGlLaunchParams.TryParse(url, out var p, out _, out _);
            Assert.AreEqual("player-001", p);
        }

        [Test]
        public void TryParse_EncodedRewardsApiUrl_Decoded()
        {
            const string url = "http://localhost:8090/?rewardsApi=http%3A%2F%2Flocalhost%3A5000";
            WebGlLaunchParams.TryParse(url, out _, out var r, out _);
            Assert.AreEqual("http://localhost:5000", r);
        }

        // ── Unknown params are ignored ───────────────────────────────

        [Test]
        public void TryParse_UnknownParams_DoNotInterfere()
        {
            const string url = "http://localhost:8090/?foo=bar&player=p1&baz=qux";
            var result = WebGlLaunchParams.TryParse(url, out var p, out _, out _);
            Assert.IsTrue(result);
            Assert.AreEqual("p1", p);
        }

        // ── Empty param values ───────────────────────────────────────

        [Test]
        public void TryParse_EmptyPlayerValue_TreatedAsNull()
        {
            const string url = "http://localhost:8090/?player=&rewardsApi=http://localhost:5000";
            WebGlLaunchParams.TryParse(url, out var p, out _, out _);
            Assert.IsNull(p);
        }

        // ── Port variants (AirPlay conflict on macOS) ────────────────

        [TestCase("http://localhost:8090/?player=p1&rewardsApi=http://localhost:5500", "http://localhost:5500")]
        [TestCase("http://localhost:8090/?player=p1&rewardsApi=http://localhost:5000", "http://localhost:5000")]
        public void TryParse_NonDefaultRewardsPort_ParsedCorrectly(string url, string expectedRewards)
        {
            WebGlLaunchParams.TryParse(url, out _, out var r, out _);
            Assert.AreEqual(expectedRewards, r);
        }
    }
}
