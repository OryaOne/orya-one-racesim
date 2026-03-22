from racesim.api.contracts import SimulationRequest
from racesim.sim.engine import SimulationService


def test_simulation_returns_ranked_driver_results():
    service = SimulationService()
    response = service.simulate(
        SimulationRequest(
            grand_prix_id="desert-crown-gp",
            weather_preset_id="dry-stable",
            simulation_runs=60,
        )
    )
    assert len(response.drivers) == 12
    assert response.drivers[0].expected_finish_position <= response.drivers[-1].expected_finish_position
    assert response.event_summary.safety_car_rate >= 0
    assert response.scenario.confidence_note
    assert response.event_summary.impact_summary
