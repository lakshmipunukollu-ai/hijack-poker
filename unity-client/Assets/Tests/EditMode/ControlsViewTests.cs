using NUnit.Framework;
using HijackPoker.UI;

namespace HijackPoker.Tests
{
    /// <summary>
    /// Tests for ControlsView.HandStepToPhaseIndex — the mapping from the 16-step
    /// state machine to the 5-segment phase indicator shown in the toolbar.
    ///
    /// Segments: Pre(0), Flop(1), Turn(2), River(3), Showdown(4)
    /// </summary>
    [TestFixture]
    public class ControlsViewTests
    {
        // ── Pre-flop segment (steps 0–5) ─────────────────────────────

        [TestCase(0)]
        [TestCase(1)]
        [TestCase(2)]
        [TestCase(3)]
        [TestCase(4)]
        [TestCase(5)]
        public void HandStepToPhaseIndex_PreFlopSteps_ReturnsZero(int step)
        {
            Assert.AreEqual(0, ControlsView.HandStepToPhaseIndex(step));
        }

        // ── Flop segment (steps 6–7) ──────────────────────────────────

        [TestCase(6)]
        [TestCase(7)]
        public void HandStepToPhaseIndex_FlopSteps_ReturnsOne(int step)
        {
            Assert.AreEqual(1, ControlsView.HandStepToPhaseIndex(step));
        }

        // ── Turn segment (steps 8–9) ──────────────────────────────────

        [TestCase(8)]
        [TestCase(9)]
        public void HandStepToPhaseIndex_TurnSteps_ReturnsTwo(int step)
        {
            Assert.AreEqual(2, ControlsView.HandStepToPhaseIndex(step));
        }

        // ── River segment (steps 10–11) ───────────────────────────────

        [TestCase(10)]
        [TestCase(11)]
        public void HandStepToPhaseIndex_RiverSteps_ReturnsThree(int step)
        {
            Assert.AreEqual(3, ControlsView.HandStepToPhaseIndex(step));
        }

        // ── Showdown segment (steps 12–15) ────────────────────────────

        [TestCase(12)]
        [TestCase(13)]
        [TestCase(14)]
        [TestCase(15)]
        public void HandStepToPhaseIndex_ShowdownSteps_ReturnsFour(int step)
        {
            Assert.AreEqual(4, ControlsView.HandStepToPhaseIndex(step));
        }

        // ── Boundary verification ─────────────────────────────────────

        [Test]
        public void HandStepToPhaseIndex_Step5_LastPreFlop_ReturnsZero()
        {
            Assert.AreEqual(0, ControlsView.HandStepToPhaseIndex(5));
        }

        [Test]
        public void HandStepToPhaseIndex_Step6_FirstFlop_ReturnsOne()
        {
            Assert.AreEqual(1, ControlsView.HandStepToPhaseIndex(6));
        }

        [Test]
        public void HandStepToPhaseIndex_Step11_LastRiver_ReturnsThree()
        {
            Assert.AreEqual(3, ControlsView.HandStepToPhaseIndex(11));
        }

        [Test]
        public void HandStepToPhaseIndex_Step12_FirstShowdown_ReturnsFour()
        {
            Assert.AreEqual(4, ControlsView.HandStepToPhaseIndex(12));
        }

        // ── All 16 steps as a single parameterised suite ──────────────

        [TestCase(0,  0)]
        [TestCase(1,  0)]
        [TestCase(2,  0)]
        [TestCase(3,  0)]
        [TestCase(4,  0)]
        [TestCase(5,  0)]
        [TestCase(6,  1)]
        [TestCase(7,  1)]
        [TestCase(8,  2)]
        [TestCase(9,  2)]
        [TestCase(10, 3)]
        [TestCase(11, 3)]
        [TestCase(12, 4)]
        [TestCase(13, 4)]
        [TestCase(14, 4)]
        [TestCase(15, 4)]
        public void HandStepToPhaseIndex_AllSteps(int step, int expectedPhase)
        {
            Assert.AreEqual(expectedPhase, ControlsView.HandStepToPhaseIndex(step));
        }
    }
}
