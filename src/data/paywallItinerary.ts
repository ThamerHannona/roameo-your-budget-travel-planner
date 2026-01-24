// Mock paywall itinerary data with generic and specific details
import type { PaywallDayItinerary, GenericActivity } from '@/types/paywall';
import { format, addDays } from 'date-fns';

const createActivity = (
  id: string,
  time: string,
  endTime: string | undefined,
  category: GenericActivity['category'],
  genericTitle: string,
  genericDescription: string,
  estimatedCost: number,
  tips: string[],
  specific: Partial<GenericActivity>
): GenericActivity => ({
  id,
  time,
  endTime,
  category,
  genericTitle,
  genericDescription,
  estimatedCost,
  tips,
  isFree: estimatedCost === 0,
  duration: endTime ? calculateDuration(time, endTime) : undefined,
  ...specific,
});

const calculateDuration = (start: string, end: string): string => {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  const diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
};

export const createPaywallItinerary = (startDate: Date = new Date()): PaywallDayItinerary[] => {
  const formatDate = (dayNum: number) => format(addDays(startDate, dayNum - 1), 'MMMM d, EEEE');

  return [
    // DAY 1 - Arrival (UNLOCKED)
    {
      id: 'day-1',
      dayNumber: 1,
      date: formatDate(1),
      totalSpent: 156,
      isLocked: false,
      weather: { temp: 72, condition: 'sunny', icon: '☀️' },
      proTips: [
        'Buy a Viva Viagem card at the airport metro station for €0.50',
        'The metro from the airport costs only €1.50 and takes 25 minutes',
        'Many restaurants close between 3-7pm, plan lunch accordingly'
      ],
      activities: [
        createActivity('d1-a1', '11:00', '12:30', 'flight', 'Arrival Flight', 
          'Direct or 1-stop flight. Estimated 10-13 hours travel time. Clear customs and grab your bags.',
          520, ['Download offline maps before departure', 'Bring empty water bottle through security'],
          {
            specificName: 'TAP Air Portugal Flight TP202',
            address: 'SFO Terminal I → LIS Humberto Delgado Airport',
            bookingUrl: 'https://www.google.com/flights',
            coordinates: { lat: 38.7813, lng: -9.1359 },
            options: [
              { name: 'TAP Air Portugal (Budget)', description: 'Direct flight, 10h 30min', price: 480 },
              { name: 'United Airlines (Best Value)', description: '1 stop in Newark, 13h', price: 520, isBestValue: true },
              { name: 'Lufthansa (Premium)', description: '1 stop Frankfurt, extra legroom', price: 680 }
            ]
          }
        ),
        createActivity('d1-a2', '12:30', '13:15', 'transport', 'Metro to City Center',
          'Take the public transit from airport to downtown. Quick and affordable option.',
          3, ['Buy a rechargeable transit card for convenience'],
          {
            specificName: 'Red Line Metro to Alameda, then Green Line to Rossio',
            address: 'Aeroporto Metro Station → Rossio',
            googleMapsUrl: 'https://maps.google.com/?q=Rossio+Station+Lisbon',
            coordinates: { lat: 38.7147, lng: -9.1410 }
          }
        ),
        createActivity('d1-a3', '13:30', '14:00', 'hotel', 'Check-in at Mid-Range Hotel',
          '4-star boutique hotel in historic district. Traditional architecture with modern amenities.',
          108, ['Request a room with courtyard view', 'Ask about rooftop terrace access'],
          {
            specificName: 'Hotel Baixa',
            address: 'Praça do Comércio 34, Baixa, Lisboa',
            phone: '+351 21 123 4567',
            bookingUrl: 'https://www.booking.com/hotel/pt/baixa-lisboa',
            coordinates: { lat: 38.7075, lng: -9.1364 },
            options: [
              { name: 'Pensão Londres (Budget)', description: '3★ Classic guesthouse, basic rooms', price: 65 },
              { name: 'Hotel Baixa (Best Value)', description: '4★ Boutique, rooftop terrace', price: 108, isBestValue: true },
              { name: 'Memmo Alfama (Luxury)', description: '5★ Design hotel, infinity pool', price: 220 }
            ]
          }
        ),
        createActivity('d1-a4', '14:30', '15:30', 'restaurant', 'Lunch at Famous Food Hall',
          'Iconic food market with 40+ vendors. Try local specialties and desserts.',
          25, ['Must-try: local egg tarts and pork sandwiches', 'Go to the back for less crowded seating'],
          {
            specificName: 'Time Out Market Lisboa',
            address: 'Av. 24 de Julho 49, Lisboa',
            phone: '+351 21 395 1274',
            bookingUrl: 'https://www.timeoutmarket.com/lisboa/',
            googleMapsUrl: 'https://maps.google.com/?q=Time+Out+Market+Lisboa',
            coordinates: { lat: 38.7069, lng: -9.1455 }
          }
        ),
        createActivity('d1-a5', '16:00', '18:00', 'attraction', 'Walking Tour of Historic District',
          'Explore grid-pattern streets, main square, and iconic elevator. Free to explore.',
          0, ['The famous elevator costs €5, but walk up from behind for free', 'Great photo spots at sunset'],
          {
            specificName: 'Baixa District & Praça do Comércio',
            address: 'Praça do Comércio, Lisboa',
            googleMapsUrl: 'https://maps.google.com/?q=Praca+do+Comercio+Lisboa',
            coordinates: { lat: 38.7075, lng: -9.1364 }
          }
        ),
        createActivity('d1-a6', '18:30', '19:30', 'attraction', 'Sunset at Panoramic Viewpoint',
          'Best sunset viewpoint with panoramic city views. Bring a camera!',
          0, ['Arrive 30 mins before sunset for best spot', 'Local vendors sell drinks nearby'],
          {
            specificName: 'Miradouro da Senhora do Monte',
            address: 'Rua da Senhora do Monte, Lisboa',
            googleMapsUrl: 'https://maps.google.com/?q=Miradouro+Senhora+do+Monte',
            coordinates: { lat: 38.7196, lng: -9.1329 }
          }
        ),
        createActivity('d1-a7', '20:00', '22:00', 'restaurant', 'Dinner at Legendary Seafood Restaurant',
          'Famous local seafood spot. Must-try: prawns and the signature sandwich to finish.',
          55, ['No reservations - arrive by 7:30pm or expect 1hr+ wait', 'Cash preferred for faster service'],
          {
            specificName: 'Cervejaria Ramiro',
            address: 'Av. Almirante Reis 1, Lisboa',
            phone: '+351 21 885 1024',
            bookingUrl: 'https://www.cervejariaramiro.com/',
            googleMapsUrl: 'https://maps.google.com/?q=Cervejaria+Ramiro',
            coordinates: { lat: 38.7203, lng: -9.1357 },
            options: [
              { name: 'Tasca do Chico (Budget)', description: 'Local tavern, authentic petiscos', price: 28 },
              { name: 'Cervejaria Ramiro (Best Value)', description: 'Famous seafood, casual vibe', price: 55, isBestValue: true },
              { name: 'Belcanto (Fine Dining)', description: '2 Michelin stars, tasting menu', price: 180 }
            ]
          }
        )
      ]
    },
    // DAY 2 - Historic Monuments (UNLOCKED)
    {
      id: 'day-2',
      dayNumber: 2,
      date: formatDate(2),
      totalSpent: 173,
      isLocked: false,
      weather: { temp: 74, condition: 'partly-cloudy', icon: '⛅' },
      proTips: [
        'Get to the famous pastry shop before 9am to avoid massive lines',
        'Historic tower and monastery are free on Sunday mornings',
        'Take tram 15E directly to the historic district'
      ],
      activities: [
        createActivity('d2-a1', '08:30', '09:30', 'restaurant', 'Breakfast at Historic Pastry Shop',
          'The original home of the famous local tarts since 1837. Get them warm with cinnamon.',
          8, ['Sit inside to see the secret bakery kitchen', 'Order at least 2 tarts per person'],
          {
            specificName: 'Pastéis de Belém',
            address: 'R. de Belém 84-92, Lisboa',
            phone: '+351 21 363 7423',
            bookingUrl: 'https://pasteisdebelem.pt/',
            googleMapsUrl: 'https://maps.google.com/?q=Pasteis+de+Belem',
            coordinates: { lat: 38.6975, lng: -9.2034 }
          }
        ),
        createActivity('d2-a2', '10:00', '12:00', 'museum', 'UNESCO World Heritage Monastery',
          'Stunning 16th century architecture. Contains famous explorer\'s tomb.',
          10, ['Audio guide included with ticket', 'Photography allowed without flash'],
          {
            specificName: 'Jerónimos Monastery',
            address: 'Praça do Império, Lisboa',
            bookingUrl: 'https://www.patrimoniocultural.gov.pt/jeronimos',
            googleMapsUrl: 'https://maps.google.com/?q=Jeronimos+Monastery',
            coordinates: { lat: 38.6979, lng: -9.2068 }
          }
        ),
        createActivity('d2-a3', '12:15', '12:45', 'attraction', 'Monument to Explorers',
          'Iconic 52-meter monument celebrating famous explorers. Great photo opportunity.',
          0, ['Free to view from outside', 'Elevator to top costs extra €6'],
          {
            specificName: 'Padrão dos Descobrimentos',
            address: 'Av. Brasília, Lisboa',
            googleMapsUrl: 'https://maps.google.com/?q=Padrao+dos+Descobrimentos',
            coordinates: { lat: 38.6936, lng: -9.2058 }
          }
        ),
        createActivity('d2-a4', '13:00', '14:00', 'restaurant', 'Lunch at Waterfront Restaurant',
          'Local gem with amazing views. Take a short ferry ride for the experience.',
          18, ['Ferry costs €2.50 round trip', 'Try the grilled fish of the day'],
          {
            specificName: 'Ponto Final',
            address: 'R. do Ginjal 72, Cacilhas',
            phone: '+351 21 276 0743',
            googleMapsUrl: 'https://maps.google.com/?q=Ponto+Final+Cacilhas',
            coordinates: { lat: 38.6873, lng: -9.1482 }
          }
        ),
        createActivity('d2-a5', '15:00', '16:00', 'attraction', 'Iconic Waterfront Tower',
          '16th-century fortress on the river. Symbol of the nation and UNESCO site.',
          8, ['Book online to skip the line', 'Best photos from the adjacent park'],
          {
            specificName: 'Torre de Belém (Belém Tower)',
            address: 'Av. Brasília, Lisboa',
            bookingUrl: 'https://www.patrimoniocultural.gov.pt/belem',
            googleMapsUrl: 'https://maps.google.com/?q=Torre+de+Belem',
            coordinates: { lat: 38.6916, lng: -9.2159 }
          }
        ),
        createActivity('d2-a6', '16:30', '18:30', 'museum', 'Contemporary Art & Architecture Museum',
          'Modern museum with stunning wave-like architecture. Walk on the rooftop.',
          9, ['Rooftop walk is free', 'Best at golden hour for photos'],
          {
            specificName: 'MAAT - Museum of Art, Architecture and Technology',
            address: 'Av. Brasília, Lisboa',
            bookingUrl: 'https://www.maat.pt/',
            googleMapsUrl: 'https://maps.google.com/?q=MAAT+Lisbon',
            coordinates: { lat: 38.6964, lng: -9.1914 }
          }
        ),
        createActivity('d2-a7', '19:30', '21:30', 'restaurant', 'Fine Dining Experience',
          'Award-winning restaurant by celebrated chef. Book weeks ahead for this experience.',
          120, ['Dress code: smart casual', 'Tasting menu recommended for first visit'],
          {
            specificName: 'Belcanto',
            address: 'R. Serpa Pinto 10A, Lisboa',
            phone: '+351 21 342 0607',
            bookingUrl: 'https://www.belcanto.pt/',
            googleMapsUrl: 'https://maps.google.com/?q=Belcanto+Lisbon',
            coordinates: { lat: 38.7102, lng: -9.1423 },
            options: [
              { name: 'Taberna da Rua das Flores (Budget)', description: 'Wine bar, creative tapas', price: 45 },
              { name: 'Alma (Mid-Range)', description: '1 Michelin star, Portuguese', price: 85 },
              { name: 'Belcanto (Fine Dining)', description: '2 Michelin stars, tasting menu', price: 120, isBestValue: true }
            ]
          }
        )
      ]
    },
    // DAY 3 - Old Town & Music (LOCKED)
    {
      id: 'day-3',
      dayNumber: 3,
      date: formatDate(3),
      totalSpent: 112,
      isLocked: true,
      weather: { temp: 70, condition: 'sunny', icon: '☀️' },
      proTips: [
        'Wear comfortable shoes - the old town is all hills and cobblestones',
        'Famous tram is touristy and crowded; walk or take alternative route',
        'Traditional music shows start late (9-10pm). Book ahead!'
      ],
      activities: [
        createActivity('d3-a1', '09:00', '10:00', 'restaurant', 'Breakfast at Historic Café',
          'Famous café since 1905. Sit next to the bronze statue of a celebrated poet.',
          12, ['Try the local pastries', 'Great people watching spot'],
          {
            specificName: 'Café A Brasileira',
            address: 'R. Garrett 122, Lisboa',
            googleMapsUrl: 'https://maps.google.com/?q=A+Brasileira+Lisbon',
            coordinates: { lat: 38.7107, lng: -9.1424 }
          }
        ),
        createActivity('d3-a2', '10:30', '12:30', 'tour', 'Guided Walking Tour of Old Town',
          'Free guided tour through the oldest neighborhood. Tips appreciated.',
          0, ['Tip €5-10 per person for the guide', 'Comfortable shoes essential'],
          {
            specificName: 'Alfama District Walking Tour',
            address: 'Largo das Portas do Sol, Lisboa',
            bookingUrl: 'https://www.freetour.com/lisbon/alfama',
            googleMapsUrl: 'https://maps.google.com/?q=Alfama+Lisbon',
            coordinates: { lat: 38.7122, lng: -9.1302 }
          }
        ),
        createActivity('d3-a3', '13:00', '14:00', 'restaurant', 'Lunch at Cozy Local Tavern',
          'Tiny hole-in-the-wall with amazing small plates. Get the croquettes.',
          20, ['Cash only', 'Arrive early as it fills up fast'],
          {
            specificName: 'Tasca do Chico',
            address: 'R. dos Remédios 83, Lisboa',
            phone: '+351 21 886 5670',
            googleMapsUrl: 'https://maps.google.com/?q=Tasca+do+Chico+Alfama',
            coordinates: { lat: 38.7115, lng: -9.1262 }
          }
        ),
        createActivity('d3-a4', '14:30', '16:00', 'museum', 'National Tile Museum',
          'Unique local art tradition. Beautiful 16th-18th century decorative pieces.',
          5, ['Don\'t miss the famous city panorama piece', 'Lovely café in the cloister'],
          {
            specificName: 'Museu Nacional do Azulejo',
            address: 'R. da Madre de Deus 4, Lisboa',
            bookingUrl: 'https://www.museudoazulejo.gov.pt/',
            googleMapsUrl: 'https://maps.google.com/?q=Museu+Nacional+do+Azulejo',
            coordinates: { lat: 38.7250, lng: -9.1143 }
          }
        ),
        createActivity('d3-a5', '16:30', '18:00', 'attraction', 'Hilltop Castle with Best Views',
          'Historic castle with the best panoramic views in the city. Explore ruins and gardens.',
          10, ['Come for sunset if possible', 'Peacocks roam the gardens'],
          {
            specificName: 'Castelo de São Jorge',
            address: 'R. de Santa Cruz do Castelo, Lisboa',
            bookingUrl: 'https://castelodesaojorge.pt/',
            googleMapsUrl: 'https://maps.google.com/?q=Castelo+de+Sao+Jorge',
            coordinates: { lat: 38.7139, lng: -9.1334 }
          }
        ),
        createActivity('d3-a6', '18:30', '19:30', 'free-time', 'Free Time to Explore',
          'Wander narrow streets, browse local shops, and soak up the atmosphere.',
          0, ['Great for souvenir shopping', 'Many hidden viewpoints to discover'],
          {
            specificName: 'Alfama Free Exploration',
            address: 'Alfama, Lisboa',
            googleMapsUrl: 'https://maps.google.com/?q=Alfama+Lisbon',
            coordinates: { lat: 38.7115, lng: -9.1302 }
          }
        ),
        createActivity('d3-a7', '20:00', '22:00', 'restaurant', 'Dinner at Wine Bar',
          'Creative local tapas in intimate setting. No reservations, arrive early.',
          35, ['Try the tasting plates', 'Excellent local wine selection'],
          {
            specificName: 'Taberna da Rua das Flores',
            address: 'R. das Flores 103, Lisboa',
            googleMapsUrl: 'https://maps.google.com/?q=Taberna+da+Rua+das+Flores',
            coordinates: { lat: 38.7119, lng: -9.1443 }
          }
        ),
        createActivity('d3-a8', '22:30', '00:30', 'nightlife', 'Traditional Music Show',
          'Intimate venue in a former chapel. Authentic soulful performances.',
          30, ['Book at least 2 days ahead', 'Minimum drink order required'],
          {
            specificName: 'Mesa de Frades',
            address: 'R. dos Remédios 139A, Lisboa',
            bookingUrl: 'https://www.facebook.com/mesadefrades/',
            googleMapsUrl: 'https://maps.google.com/?q=Mesa+de+Frades+Lisbon',
            coordinates: { lat: 38.7122, lng: -9.1248 }
          }
        )
      ]
    },
    // DAY 4 - Day Trip to Fairytale Town (LOCKED)
    {
      id: 'day-4',
      dayNumber: 4,
      date: formatDate(4),
      totalSpent: 98,
      isLocked: true,
      weather: { temp: 68, condition: 'partly-cloudy', icon: '⛅' },
      proTips: [
        'Take the first train (8:00am) to beat the crowds',
        'Buy the day pass for unlimited bus rides + palace discounts',
        'Main palace is uphill - take the shuttle or prepare for 20-min climb'
      ],
      activities: [
        createActivity('d4-a1', '08:00', '08:45', 'transport', 'Scenic Train Ride',
          'Beautiful 40-minute train ride through countryside to fairytale town.',
          4.50, ['Sit on the right side for best views', 'Buy round-trip ticket'],
          {
            specificName: 'Train from Rossio to Sintra',
            address: 'Praça Dom Pedro IV, Lisboa',
            googleMapsUrl: 'https://maps.google.com/?q=Rossio+Train+Station',
            coordinates: { lat: 38.7147, lng: -9.1410 }
          }
        ),
        createActivity('d4-a2', '09:00', '11:30', 'attraction', 'Colorful Romantic Palace',
          'Most colorful palace in Europe. Don\'t miss the surrounding gardens.',
          14, ['Book tickets online in advance', 'Wear layers - it\'s cooler up in the hills'],
          {
            specificName: 'Palácio Nacional da Pena (Pena Palace)',
            address: 'Estrada da Pena, Sintra',
            bookingUrl: 'https://www.parquesdesintra.pt/pena',
            googleMapsUrl: 'https://maps.google.com/?q=Pena+Palace+Sintra',
            coordinates: { lat: 38.7876, lng: -9.3906 }
          }
        ),
        createActivity('d4-a3', '12:00', '13:00', 'restaurant', 'Lunch at Local Bakery',
          'Famous for traditional cheese pastries. Perfect quick lunch stop.',
          8, ['Try the signature cheese tart', 'Can get crowded - order to go'],
          {
            specificName: 'Piriquita',
            address: 'R. das Padarias 1, Sintra',
            googleMapsUrl: 'https://maps.google.com/?q=Piriquita+Sintra',
            coordinates: { lat: 38.7973, lng: -9.3905 }
          }
        ),
        createActivity('d4-a4', '13:30', '15:30', 'attraction', 'Mysterious Gothic Estate',
          'Gothic revival palace with mysterious wells and underground tunnels.',
          10, ['The spiral well is the highlight', 'Easy to spend 2+ hours here'],
          {
            specificName: 'Quinta da Regaleira',
            address: 'R. Barbosa du Bocage, Sintra',
            bookingUrl: 'https://www.rfregaleira.pt/',
            googleMapsUrl: 'https://maps.google.com/?q=Quinta+da+Regaleira',
            coordinates: { lat: 38.7962, lng: -9.3960 }
          }
        ),
        createActivity('d4-a5', '16:00', '17:30', 'attraction', 'Medieval Moorish Castle',
          'Hilltop castle ruins with spectacular views. Walk the ancient walls.',
          8, ['Great views of both palaces from here', 'Combine ticket with other sites for savings'],
          {
            specificName: 'Castelo dos Mouros (Moorish Castle)',
            address: 'Estrada da Pena, Sintra',
            bookingUrl: 'https://www.parquesdesintra.pt/mouros',
            googleMapsUrl: 'https://maps.google.com/?q=Castelo+dos+Mouros+Sintra',
            coordinates: { lat: 38.7922, lng: -9.3891 }
          }
        ),
        createActivity('d4-a6', '18:00', '18:45', 'transport', 'Train Back to City',
          'Return journey through countryside. Rest your feet after a day of walking.',
          4.50, ['Trains run every 20 minutes', 'Grab a snack for the ride'],
          {
            specificName: 'Train from Sintra to Rossio',
            address: 'Sintra Train Station',
            googleMapsUrl: 'https://maps.google.com/?q=Sintra+Train+Station',
            coordinates: { lat: 38.7980, lng: -9.3853 }
          }
        ),
        createActivity('d4-a7', '19:30', '21:30', 'restaurant', 'Dinner Back in the City',
          'Casual neighborhood restaurant. Great value local cooking.',
          35, ['Ask for daily specials', 'Good wine list at fair prices'],
          {
            specificName: 'Zé dos Cornos',
            address: 'Beco dos Surradores 5, Lisboa',
            phone: '+351 21 886 9847',
            googleMapsUrl: 'https://maps.google.com/?q=Ze+dos+Cornos+Lisbon',
            coordinates: { lat: 38.7108, lng: -9.1315 }
          }
        )
      ]
    },
    // DAY 5 - Departure (LOCKED)
    {
      id: 'day-5',
      dayNumber: 5,
      date: formatDate(5),
      totalSpent: 78,
      isLocked: true,
      weather: { temp: 73, condition: 'sunny', icon: '☀️' },
      proTips: [
        'Most hotels allow late checkout until 12pm - ask nicely',
        'Airport has great duty-free pastry shops',
        'Keep €3 cash for metro to airport'
      ],
      activities: [
        createActivity('d5-a1', '08:00', '09:00', 'restaurant', 'Final Breakfast at Local Café',
          'Last chance for local pastries and strong coffee. Savor the moment.',
          10, ['Try a different pastry than the famous one', 'Great people watching'],
          {
            specificName: 'Fabrica Coffee Roasters',
            address: 'R. das Portas de Santo Antão 136, Lisboa',
            googleMapsUrl: 'https://maps.google.com/?q=Fabrica+Coffee+Roasters+Lisbon',
            coordinates: { lat: 38.7162, lng: -9.1409 }
          }
        ),
        createActivity('d5-a2', '09:30', '11:00', 'shopping', 'Souvenir Shopping in Old Town',
          'Pick up last-minute gifts: local tiles, cork products, and artisan goods.',
          30, ['Cork products are lightweight and unique', 'Haggling not common here'],
          {
            specificName: 'A Vida Portuguesa',
            address: 'R. Anchieta 11, Lisboa',
            googleMapsUrl: 'https://maps.google.com/?q=A+Vida+Portuguesa+Lisbon',
            coordinates: { lat: 38.7105, lng: -9.1400 }
          }
        ),
        createActivity('d5-a3', '11:30', '12:30', 'attraction', 'Final Viewpoint Visit',
          'One last panoramic view to say goodbye to this beautiful city.',
          0, ['Perfect for final photos', 'Café nearby for a last drink'],
          {
            specificName: 'Miradouro da Graça',
            address: 'Largo da Graça, Lisboa',
            googleMapsUrl: 'https://maps.google.com/?q=Miradouro+da+Graca',
            coordinates: { lat: 38.7172, lng: -9.1308 }
          }
        ),
        createActivity('d5-a4', '13:00', '14:00', 'restaurant', 'Farewell Lunch',
          'Light farewell meal before heading to airport. Local comfort food.',
          25, ['Keep it light before the flight', 'Try the soup of the day'],
          {
            specificName: 'Café da Garagem',
            address: 'Costa do Castelo 75, Lisboa',
            googleMapsUrl: 'https://maps.google.com/?q=Cafe+da+Garagem+Lisbon',
            coordinates: { lat: 38.7139, lng: -9.1334 }
          }
        ),
        createActivity('d5-a5', '14:30', '15:00', 'hotel', 'Hotel Checkout',
          'Final checkout and collect luggage. Thank the staff for a wonderful stay.',
          0, ['Double-check the safe and drawers', 'Ask for a receipt if needed'],
          {
            specificName: 'Hotel Baixa Checkout',
            address: 'Praça do Comércio 34, Baixa, Lisboa',
            coordinates: { lat: 38.7075, lng: -9.1364 }
          }
        ),
        createActivity('d5-a6', '15:30', '16:15', 'transport', 'Metro to Airport',
          'Take public transit back to airport. Quick and stress-free.',
          3, ['Allow extra time for luggage', 'Keep metro ticket until you exit'],
          {
            specificName: 'Green Line to Alameda, then Red Line to Aeroporto',
            address: 'Baixa-Chiado Metro Station',
            coordinates: { lat: 38.7105, lng: -9.1400 }
          }
        ),
        createActivity('d5-a7', '18:00', '20:30', 'flight', 'Check-in & Depart',
          'Clear security and grab one last local pastry at the airport. Safe travels!',
          0, ['Airport pastry shops are actually good', 'Duty free has local products'],
          {
            specificName: 'TAP Air Portugal Flight TP201',
            address: 'LIS Humberto Delgado Airport → SFO',
            bookingUrl: 'https://www.google.com/flights',
            coordinates: { lat: 38.7813, lng: -9.1359 }
          }
        )
      ]
    }
  ];
};

// Get trip totals
export const getPaywallTripTotals = (days: PaywallDayItinerary[]) => {
  const totalSpent = days.reduce((sum, day) => sum + day.totalSpent, 0);
  const byCategory: Record<string, number> = {
    flights: 0,
    accommodation: 0,
    activities: 0,
    food: 0,
    transportation: 0,
  };

  days.forEach(day => {
    day.activities.forEach(activity => {
      switch (activity.category) {
        case 'flight':
          byCategory.flights += activity.estimatedCost;
          break;
        case 'hotel':
          byCategory.accommodation += activity.estimatedCost;
          break;
        case 'restaurant':
          byCategory.food += activity.estimatedCost;
          break;
        case 'transport':
          byCategory.transportation += activity.estimatedCost;
          break;
        default:
          byCategory.activities += activity.estimatedCost;
      }
    });
  });

  return { totalSpent, byCategory };
};
