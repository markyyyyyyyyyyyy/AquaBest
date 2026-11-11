import bottle25 from '../../assets/WaterBottleSize/bottle_2.5.png';
import bottle5 from '../../assets/WaterBottleSize/bottle_5.png';
import bottle5Round from '../../assets/WaterBottleSize/bottle_5_round.png';

export const bottleOptions = [
  { id: 'round5', name: '5 Gallons', shape: 'Round Container', image: bottle5Round },
  { id: 'slim25', name: '2.5 Gallons', shape: 'Slim Container', image: bottle25 },
  { id: 'slim5', name: '5 Gallons', shape: 'Slim Container', image: bottle5 },
];
export const serviceOptions = {
  own: [
    { id: 'pickup-return', name: 'Pickup & Delivery', detail: 'AquaBest picks up empty containers, refills, and delivers them.' },
    { id: 'dropoff-return', name: 'Drop-off & Delivery', detail: 'You drop off empties; AquaBest delivers after refilling.' },
    { id: 'walkin', name: 'Walk-in', detail: 'You drop off and collect your containers at the station.' },
  ],
  store: [
    { id: 'delivery', name: 'Delivery', detail: 'AquaBest delivers the requested containers to you.' },
    { id: 'walkin', name: 'Walk-in Pickup', detail: 'You collect the containers at the station.' },
  ],
};
export const countBottles = (quantities) => Object.values(quantities).reduce((sum, n) => sum + n, 0);
export const orderOptions = (products=[]) => [...bottleOptions, ...products];
export const selectedBottles = (quantities, products=[]) => orderOptions(products).filter((item) => (quantities[item.id] || 0) > 0);
export const isDelivery = (service) => service !== 'walkin';
