"""Named loadouts: starting points for spawning variety and for the album."""
def P(vehicle, name, tyre=None, rim=None, parts=(), paint=None, note=''):
    d = {'vehicle': vehicle, 'name': name, 'parts': list(parts)}
    if tyre: d['tyre'] = tyre
    if rim: d['rim'] = rim
    if paint: d['paint'] = paint
    if note: d['note'] = note
    return d
PRESETS = [
  P('offroader', 'Overlander', 'mud_terrain', 'beadlock', ['roof_basket_M', 'bull_bar_lights_M', 'snorkel_M', 'fender_flare_XL', 'rock_slider_S', 'spare_door'], note='a loaded expedition 4x4'),
  P('pickup', 'Farm truck', 'all_terrain', 'steel_rust', ['bull_bar_M', 'load_hay_M', 'mud_flap'], note='bales on the back'),
  P('pickup', 'Plough truck', 'snow_chains', 'steel', ['snow_plough_M', 'roof_lights_C', 'salt_spreader'], note='keeps the roads open in winter'),
  P('crew_pickup', 'Camper', 'all_terrain', 'alloy5', ['roof_bars_C', 'bed_cap_S'], note='sleeps three'),
  P('sedan', 'Police', 'road', 'steel', ['light_bar_emergency_M', 'push_bar_M'], note='a patrol car'),
  P('sedan', 'Taxi', 'road', 'steel', ['taxi_sign'], note='a cab'),
  P('wagon', 'Roof load', 'road', 'alloy5', ['roof_luggage_L'], note='a family with the car packed'),
  P('hatchback', 'Courier', 'road', 'alloy5', ['roof_box_S', 'stripe_side_white'], note='a delivery run'),
  P('suv', 'Survivor SUV', 'all_terrain', 'alloy_dark', ['roof_basket_M', 'bull_bar_M', 'fender_flare_L', 'running_board_M']),
  P('van', 'Camper van', 'all_terrain', 'steel', ['roof_tent_L', 'rear_bumper_M']),
  P('flatbed', 'Scrap runner', 'heavy', 'steel_rust', ['load_scrap_L', 'headache_rack'][:1]),
  P('box_truck', 'Convoy truck', 'military', 'steel', ['ram_bumper_L', 'roof_bars_L'][:1]),
  P('dump_truck', 'Road crew', 'heavy', 'steel', ['beacon_bar_L', 'exhaust_stacks'], note='orange warning lights'),
  P('jon_boat', 'River fisher', parts=['outboard_S', 'seat_helm', 'tackle_box', 'cooler', 'rod_holders'], note='a quiet fishing boat'),
  P('bass_boat', 'Speed boat', parts=['outboard_L', 'nav_lights', 'cooler', 'windscreen']),
  P('pontoon_boat', 'Party barge', parts=['outboard_M', 'bimini_L', 'cooler', 'fender_buoys']),
  P('runabout', 'Salvage boat', parts=['outboard_L', 'spotlight_boat', 'storage_crate', 'anchor_bow']),
  P('bicycle_mountain', 'Trail bike', parts=['bike_bottle', 'bike_light_front', 'kickstand']),
  P('bicycle_city', 'Commuter', parts=['bike_basket_front', 'bike_rack_rear', 'bike_fender', 'bike_bell']),
  P('motorbike_dirt', 'Courier moto', parts=['saddlebags', 'moto_screen', 'crash_bars']),
  P('quad_bike', 'Farm quad', parts=['quad_rack_front', 'quad_rack_rear', 'quad_winch']),
]
