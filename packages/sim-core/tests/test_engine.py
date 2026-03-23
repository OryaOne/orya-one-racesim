from racesim.api.contracts import EnvironmentControls, SimulationRequest, SimulationWeights
from racesim.sim.engine import SimulationService


def test_simulation_returns_ranked_driver_results():
    service = SimulationService()
    response = service.simulate(
        SimulationRequest(
            grand_prix_id="bahrain-grand-prix",
            weather_preset_id="heat-deg",
            simulation_runs=60,
        )
    )
    assert len(response.drivers) == 22
    assert response.drivers[0].expected_finish_position <= response.drivers[-1].expected_finish_position
    assert response.event_summary.safety_car_rate >= 0
    assert response.scenario.confidence_note
    assert response.event_summary.impact_summary
    assert response.drivers[0].expected_points >= 0
    assert "pace_component" in response.drivers[0].diagnostics
    assert "track_fit_score" in response.drivers[0].diagnostics


def test_monaco_and_monza_do_not_share_the_same_top_three_order():
    service = SimulationService()
    monaco = service.simulate(
        SimulationRequest(
            grand_prix_id="monaco-grand-prix",
            weather_preset_id="dry-baseline",
            simulation_runs=120,
        )
    )
    monza = service.simulate(
        SimulationRequest(
            grand_prix_id="italian-grand-prix",
            weather_preset_id="dry-baseline",
            simulation_runs=120,
        )
    )

    monaco_top_three = [driver.driver_id for driver in monaco.drivers[:3]]
    monza_top_three = [driver.driver_id for driver in monza.drivers[:3]]

    assert monaco_top_three != monza_top_three


def test_high_chaos_wet_race_changes_winner_distribution():
    service = SimulationService()
    stable = service.simulate(
        SimulationRequest(
            grand_prix_id="belgian-grand-prix",
            weather_preset_id="dry-baseline",
            simulation_runs=140,
            environment=EnvironmentControls(
                dry_race=0.95,
                mixed_conditions=0.05,
                rain_onset=0.02,
                track_evolution=0.55,
                temperature_variation=0.2,
                energy_deployment_intensity=0.55,
                crashes=0.05,
                dnfs=0.03,
                yellow_flags=0.08,
                virtual_safety_cars=0.05,
                full_safety_cars=0.05,
                red_flags=0.01,
                late_race_incidents=0.03,
                randomness_intensity=0.2,
            ),
        )
    )
    chaos = service.simulate(
        SimulationRequest(
            grand_prix_id="belgian-grand-prix",
            weather_preset_id="rain-crossover-threat",
            simulation_runs=140,
            environment=EnvironmentControls(
                dry_race=0.2,
                mixed_conditions=0.8,
                rain_onset=0.7,
                track_evolution=0.6,
                temperature_variation=0.6,
                energy_deployment_intensity=0.7,
                crashes=0.28,
                dnfs=0.2,
                yellow_flags=0.3,
                virtual_safety_cars=0.25,
                full_safety_cars=0.3,
                red_flags=0.08,
                late_race_incidents=0.25,
                randomness_intensity=0.8,
            ),
        )
    )

    stable_winner = stable.drivers[0]
    chaos_winner = chaos.drivers[0]

    assert stable.event_summary.volatility_index != chaos.event_summary.volatility_index
    assert (
        stable_winner.driver_id != chaos_winner.driver_id
        or abs(stable_winner.win_probability - chaos_winner.win_probability) >= 0.08
    )


def test_strategy_choice_changes_driver_projection():
    service = SimulationService()
    baseline = service.simulate(
        SimulationRequest(
            grand_prix_id="italian-grand-prix",
            weather_preset_id="dry-baseline",
            simulation_runs=120,
        )
    )
    aggressive = service.simulate(
        SimulationRequest(
            grand_prix_id="italian-grand-prix",
            weather_preset_id="dry-baseline",
            simulation_runs=120,
            strategies={"max-verstappen": "two-stop-attack"},
        )
    )

    baseline_max = next(driver for driver in baseline.drivers if driver.driver_id == "max-verstappen")
    aggressive_max = next(driver for driver in aggressive.drivers if driver.driver_id == "max-verstappen")

    assert baseline_max.assigned_strategy_id != aggressive_max.assigned_strategy_id
    assert abs(baseline_max.expected_finish_position - aggressive_max.expected_finish_position) >= 1.0


def test_qualifying_weight_changes_the_top_three_distribution():
    service = SimulationService()
    high_qualifying = service.simulate(
        SimulationRequest(
            grand_prix_id="monaco-grand-prix",
            weather_preset_id="dry-baseline",
            simulation_runs=120,
            weights=SimulationWeights(qualifying_importance=0.95),
        )
    )
    low_qualifying = service.simulate(
        SimulationRequest(
            grand_prix_id="monaco-grand-prix",
            weather_preset_id="dry-baseline",
            simulation_runs=120,
            weights=SimulationWeights(qualifying_importance=0.2),
        )
    )

    high_top_three = [driver.driver_id for driver in high_qualifying.drivers[:3]]
    low_top_three = [driver.driver_id for driver in low_qualifying.drivers[:3]]

    assert high_top_three != low_top_three
