// Mock itinerary data for 5 days in Lisbon
import type { DayPlan, Activity } from '@/types/itinerary';

// Lisbon center coordinates
const LISBON_CENTER = { lat: 38.7223, lng: -9.1393 };

// Helper to create date from day number
const getDateForDay = (dayNumber: number, startDate: Date = new Date()): Date => {
  const date = new Date(startDate);
  date.setDate(date.getDate() + dayNumber - 1);
  return date;
};

export const createLisbonItinerary = (startDate: Date, dailyBudget: number): DayPlan[] => {
  const days: DayPlan[] = [
    // DAY 1 - Arrival & Baixa District
    {
      id: 'day-1',
      dayNumber: 1,
      date: getDateForDay(1, startDate),
      weather: { temp: 72, condition: 'sunny', icon: '☀️' },
      dailyBudget,
      proTips: [
        'Buy a Viva Viagem card at the airport metro station for €0.50 - load it with money for all public transport',
        'The metro from the airport costs only €1.50 and takes 25 minutes to city center',
        'Many restaurants close between 3-7pm, plan lunch accordingly'
      ],
      activities: [
        {
          id: 'd1-a1',
          time: '11:00',
          endTime: '12:30',
          type: 'flight',
          name: 'Arrive at Lisbon Airport',
          description: 'Land at Humberto Delgado Airport (LIS). Clear customs and grab your bags.',
          cost: 0,
          duration: '1h 30min',
          location: {
            name: 'Lisbon Airport',
            address: 'Alameda das Comunidades Portuguesas, Lisboa',
            coordinates: { lat: 38.7813, lng: -9.1359 },
            googleMapsUrl: 'https://maps.google.com/?q=Lisbon+Airport'
          },
          isFree: true
        },
        {
          id: 'd1-a2',
          time: '12:30',
          endTime: '13:15',
          type: 'transport',
          name: 'Metro to City Center',
          description: 'Take the Red Line metro from Aeroporto to Alameda, then Green Line to Rossio.',
          cost: 3,
          duration: '45min',
          location: {
            name: 'Aeroporto Metro Station',
            address: 'Alameda das Comunidades Portuguesas, Lisboa',
            coordinates: { lat: 38.7689, lng: -9.1284 }
          },
          isFree: false
        },
        {
          id: 'd1-a3',
          time: '13:30',
          endTime: '14:00',
          type: 'hotel',
          name: 'Check-in at Hotel',
          description: 'Drop off luggage and freshen up. Most hotels allow early check-in.',
          cost: 0,
          duration: '30min',
          location: {
            name: 'Hotel Baixa',
            address: 'Praça do Comércio, Baixa, Lisboa',
            coordinates: { lat: 38.7075, lng: -9.1364 }
          },
          isFree: true
        },
        {
          id: 'd1-a4',
          time: '14:30',
          endTime: '15:30',
          type: 'restaurant',
          name: 'Lunch at Time Out Market',
          description: 'Famous food hall with 40+ vendors. Try pastéis de nata and bifana (pork sandwich).',
          cost: 25,
          duration: '1h',
          location: {
            name: 'Time Out Market Lisboa',
            address: 'Av. 24 de Julho 49, Lisboa',
            coordinates: { lat: 38.7069, lng: -9.1455 },
            googleMapsUrl: 'https://maps.google.com/?q=Time+Out+Market+Lisboa'
          },
          bookingUrl: 'https://www.timeoutmarket.com/lisboa/',
          isFree: false
        },
        {
          id: 'd1-a5',
          time: '16:00',
          endTime: '18:00',
          type: 'attraction',
          name: 'Walk through Baixa District',
          description: 'Explore the grid-pattern streets, Praça do Comércio, and Santa Justa Elevator.',
          cost: 0,
          duration: '2h',
          location: {
            name: 'Praça do Comércio',
            address: 'Praça do Comércio, Lisboa',
            coordinates: { lat: 38.7075, lng: -9.1364 },
            googleMapsUrl: 'https://maps.google.com/?q=Praca+do+Comercio+Lisboa'
          },
          tips: ['The Santa Justa Elevator costs €5.30, but you can walk up for free from behind'],
          isFree: true
        },
        {
          id: 'd1-a6',
          time: '18:30',
          endTime: '19:30',
          type: 'attraction',
          name: 'Sunset at Miradouro da Senhora do Monte',
          description: 'Best sunset viewpoint in Lisbon with panoramic city views.',
          cost: 0,
          duration: '1h',
          location: {
            name: 'Miradouro da Senhora do Monte',
            address: 'Rua da Senhora do Monte, Lisboa',
            coordinates: { lat: 38.7196, lng: -9.1329 },
            googleMapsUrl: 'https://maps.google.com/?q=Miradouro+Senhora+do+Monte'
          },
          isFree: true
        },
        {
          id: 'd1-a7',
          time: '20:00',
          endTime: '22:00',
          type: 'restaurant',
          name: 'Dinner at Cervejaria Ramiro',
          description: 'Legendary seafood restaurant. Must-try: tiger prawns and prego sandwich to finish.',
          cost: 55,
          duration: '2h',
          location: {
            name: 'Cervejaria Ramiro',
            address: 'Av. Almirante Reis 1, Lisboa',
            coordinates: { lat: 38.7203, lng: -9.1357 },
            googleMapsUrl: 'https://maps.google.com/?q=Cervejaria+Ramiro'
          },
          bookingUrl: 'https://www.cervejariaramiro.com/',
          tips: ['No reservations - arrive by 7:30pm or expect a 1hr+ wait'],
          isFree: false
        }
      ]
    },
    // DAY 2 - Belém & History
    {
      id: 'day-2',
      dayNumber: 2,
      date: getDateForDay(2, startDate),
      weather: { temp: 74, condition: 'partly-cloudy', icon: '⛅' },
      dailyBudget,
      proTips: [
        'Get to Pastéis de Belém before 9am to avoid the massive lines',
        'Belém Tower and Jerónimos Monastery are free on Sunday mornings',
        'The 15E tram goes directly to Belém from Praça da Figueira'
      ],
      activities: [
        {
          id: 'd2-a1',
          time: '08:30',
          endTime: '09:30',
          type: 'restaurant',
          name: 'Breakfast at Pastéis de Belém',
          description: 'The original home of pastéis de nata since 1837. Get them warm with cinnamon.',
          cost: 8,
          duration: '1h',
          location: {
            name: 'Pastéis de Belém',
            address: 'R. de Belém 84-92, Lisboa',
            coordinates: { lat: 38.6975, lng: -9.2034 },
            googleMapsUrl: 'https://maps.google.com/?q=Pasteis+de+Belem'
          },
          isFree: false
        },
        {
          id: 'd2-a2',
          time: '10:00',
          endTime: '12:00',
          type: 'museum',
          name: 'Jerónimos Monastery',
          description: 'UNESCO World Heritage site. Stunning Manueline architecture and Vasco da Gama\'s tomb.',
          cost: 10,
          duration: '2h',
          location: {
            name: 'Mosteiro dos Jerónimos',
            address: 'Praça do Império, Lisboa',
            coordinates: { lat: 38.6979, lng: -9.2068 },
            googleMapsUrl: 'https://maps.google.com/?q=Jeronimos+Monastery'
          },
          bookingUrl: 'https://www.patrimoniocultural.gov.pt/en/museus-e-monumentos/dgpc/m/mosteiro-dos-jeronimos/',
          isFree: false
        },
        {
          id: 'd2-a3',
          time: '12:15',
          endTime: '12:45',
          type: 'attraction',
          name: 'Monument to the Discoveries',
          description: 'Iconic 52-meter monument celebrating Portuguese explorers. Great photo op.',
          cost: 0,
          duration: '30min',
          location: {
            name: 'Padrão dos Descobrimentos',
            address: 'Av. Brasília, Lisboa',
            coordinates: { lat: 38.6936, lng: -9.2058 },
            googleMapsUrl: 'https://maps.google.com/?q=Padrao+dos+Descobrimentos'
          },
          isFree: true
        },
        {
          id: 'd2-a4',
          time: '13:00',
          endTime: '14:00',
          type: 'restaurant',
          name: 'Lunch at Ponto Final',
          description: 'Take the ferry to Cacilhas for this local gem with amazing views back to Lisbon.',
          cost: 18,
          duration: '1h',
          location: {
            name: 'Ponto Final',
            address: 'R. do Ginjal 72, Cacilhas',
            coordinates: { lat: 38.6873, lng: -9.1482 },
            googleMapsUrl: 'https://maps.google.com/?q=Ponto+Final+Cacilhas'
          },
          tips: ['Ferry costs €2.50 round trip from Cais do Sodré'],
          isFree: false
        },
        {
          id: 'd2-a5',
          time: '15:00',
          endTime: '16:00',
          type: 'attraction',
          name: 'Belém Tower',
          description: 'Iconic 16th-century fortress on the Tagus River. Symbol of Portugal.',
          cost: 8,
          duration: '1h',
          location: {
            name: 'Torre de Belém',
            address: 'Av. Brasília, Lisboa',
            coordinates: { lat: 38.6916, lng: -9.2159 },
            googleMapsUrl: 'https://maps.google.com/?q=Torre+de+Belem'
          },
          bookingUrl: 'https://www.patrimoniocultural.gov.pt/en/museus-e-monumentos/dgpc/m/torre-de-belem/',
          isFree: false
        },
        {
          id: 'd2-a6',
          time: '16:30',
          endTime: '18:30',
          type: 'museum',
          name: 'MAAT - Museum of Art, Architecture and Technology',
          description: 'Contemporary museum with stunning wave-like architecture. Walk on the roof.',
          cost: 9,
          duration: '2h',
          location: {
            name: 'MAAT',
            address: 'Av. Brasília, Lisboa',
            coordinates: { lat: 38.6964, lng: -9.1914 },
            googleMapsUrl: 'https://maps.google.com/?q=MAAT+Lisbon'
          },
          isFree: false
        },
        {
          id: 'd2-a7',
          time: '19:30',
          endTime: '21:30',
          type: 'restaurant',
          name: 'Dinner at Belcanto',
          description: 'Two Michelin star restaurant by chef José Avillez. Book weeks ahead.',
          cost: 120,
          duration: '2h',
          location: {
            name: 'Belcanto',
            address: 'R. Serpa Pinto 10A, Lisboa',
            coordinates: { lat: 38.7102, lng: -9.1423 },
            googleMapsUrl: 'https://maps.google.com/?q=Belcanto+Lisbon'
          },
          bookingUrl: 'https://www.belcanto.pt/',
          isFree: false
        }
      ]
    },
    // DAY 3 - Alfama & Fado
    {
      id: 'day-3',
      dayNumber: 3,
      date: getDateForDay(3, startDate),
      weather: { temp: 70, condition: 'sunny', icon: '☀️' },
      dailyBudget,
      proTips: [
        'Wear comfortable shoes - Alfama is all hills and cobblestones',
        'The 28 tram is touristy and crowded; walk or take the 12E instead',
        'Fado shows start late (9-10pm). Book ahead for A Tasca do Chico'
      ],
      activities: [
        {
          id: 'd3-a1',
          time: '09:00',
          endTime: '10:00',
          type: 'restaurant',
          name: 'Breakfast at Café A Brasileira',
          description: 'Historic café since 1905. Sit with the bronze statue of poet Fernando Pessoa.',
          cost: 12,
          duration: '1h',
          location: {
            name: 'A Brasileira',
            address: 'R. Garrett 122, Lisboa',
            coordinates: { lat: 38.7107, lng: -9.1424 },
            googleMapsUrl: 'https://maps.google.com/?q=A+Brasileira+Lisbon'
          },
          isFree: false
        },
        {
          id: 'd3-a2',
          time: '10:30',
          endTime: '12:30',
          type: 'tour',
          name: 'Alfama Walking Tour',
          description: 'Free guided tour through the oldest neighborhood. Tips appreciated.',
          cost: 0,
          duration: '2h',
          location: {
            name: 'Alfama District',
            address: 'Largo das Portas do Sol, Lisboa',
            coordinates: { lat: 38.7122, lng: -9.1302 },
            googleMapsUrl: 'https://maps.google.com/?q=Alfama+Lisbon'
          },
          tips: ['Tip €5-10 per person for the guide'],
          isFree: true
        },
        {
          id: 'd3-a3',
          time: '13:00',
          endTime: '14:00',
          type: 'restaurant',
          name: 'Lunch at Tasca do Chico',
          description: 'Tiny hole-in-the-wall with amazing petiscos. Get the croquettes.',
          cost: 20,
          duration: '1h',
          location: {
            name: 'Tasca do Chico',
            address: 'R. dos Remédios 83, Lisboa',
            coordinates: { lat: 38.7115, lng: -9.1262 },
            googleMapsUrl: 'https://maps.google.com/?q=Tasca+do+Chico+Alfama'
          },
          isFree: false
        },
        {
          id: 'd3-a4',
          time: '14:30',
          endTime: '16:00',
          type: 'museum',
          name: 'National Tile Museum',
          description: 'Portugal\'s unique azulejo tradition. Beautiful 16th-18th century tiles.',
          cost: 5,
          duration: '1h 30min',
          location: {
            name: 'Museu Nacional do Azulejo',
            address: 'R. da Madre de Deus 4, Lisboa',
            coordinates: { lat: 38.7250, lng: -9.1143 },
            googleMapsUrl: 'https://maps.google.com/?q=Museu+Nacional+do+Azulejo'
          },
          isFree: false
        },
        {
          id: 'd3-a5',
          time: '16:30',
          endTime: '18:00',
          type: 'attraction',
          name: 'São Jorge Castle',
          description: 'Moorish castle with the best views in Lisbon. Explore the ruins and gardens.',
          cost: 10,
          duration: '1h 30min',
          location: {
            name: 'Castelo de São Jorge',
            address: 'R. de Santa Cruz do Castelo, Lisboa',
            coordinates: { lat: 38.7139, lng: -9.1334 },
            googleMapsUrl: 'https://maps.google.com/?q=Castelo+de+Sao+Jorge'
          },
          bookingUrl: 'https://castelodesaojorge.pt/',
          isFree: false
        },
        {
          id: 'd3-a6',
          time: '18:30',
          endTime: '19:30',
          type: 'free-time',
          name: 'Free Time in Alfama',
          description: 'Wander the narrow streets, browse local shops, and soak up the atmosphere.',
          cost: 0,
          duration: '1h',
          location: {
            name: 'Alfama District',
            address: 'Alfama, Lisboa',
            coordinates: { lat: 38.7115, lng: -9.1302 }
          },
          isFree: true
        },
        {
          id: 'd3-a7',
          time: '20:00',
          endTime: '22:00',
          type: 'restaurant',
          name: 'Dinner at Taberna da Rua das Flores',
          description: 'Wine bar with creative Portuguese tapas. No reservations, arrive early.',
          cost: 35,
          duration: '2h',
          location: {
            name: 'Taberna da Rua das Flores',
            address: 'R. das Flores 103, Lisboa',
            coordinates: { lat: 38.7119, lng: -9.1443 },
            googleMapsUrl: 'https://maps.google.com/?q=Taberna+da+Rua+das+Flores'
          },
          isFree: false
        },
        {
          id: 'd3-a8',
          time: '22:30',
          endTime: '00:30',
          type: 'nightlife',
          name: 'Fado Show at Mesa de Frades',
          description: 'Intimate fado house in a former chapel. Authentic soulful performances.',
          cost: 30,
          duration: '2h',
          location: {
            name: 'Mesa de Frades',
            address: 'R. dos Remédios 139A, Lisboa',
            coordinates: { lat: 38.7122, lng: -9.1248 },
            googleMapsUrl: 'https://maps.google.com/?q=Mesa+de+Frades+Lisbon'
          },
          bookingUrl: 'https://www.facebook.com/mesadefrades/',
          isFree: false
        }
      ]
    },
    // DAY 4 - Sintra Day Trip
    {
      id: 'day-4',
      dayNumber: 4,
      date: getDateForDay(4, startDate),
      weather: { temp: 68, condition: 'partly-cloudy', icon: '⛅' },
      dailyBudget,
      proTips: [
        'Take the first train (8:00am) from Rossio to beat the crowds',
        'Buy the Sintra Green Card for unlimited bus rides + palace discounts',
        'Pena Palace is uphill - take the bus or prepare for a 20-min climb'
      ],
      activities: [
        {
          id: 'd4-a1',
          time: '08:00',
          endTime: '08:45',
          type: 'transport',
          name: 'Train to Sintra',
          description: 'Scenic 40-minute train ride through Portuguese countryside.',
          cost: 4.50,
          duration: '45min',
          location: {
            name: 'Rossio Train Station',
            address: 'Praça Dom Pedro IV, Lisboa',
            coordinates: { lat: 38.7147, lng: -9.1410 },
            googleMapsUrl: 'https://maps.google.com/?q=Rossio+Train+Station'
          },
          isFree: false
        },
        {
          id: 'd4-a2',
          time: '09:00',
          endTime: '11:30',
          type: 'attraction',
          name: 'Pena Palace',
          description: 'Romantic 19th-century palace. Most colorful in Europe. Don\'t miss the gardens.',
          cost: 14,
          duration: '2h 30min',
          location: {
            name: 'Palácio Nacional da Pena',
            address: 'Estrada da Pena, Sintra',
            coordinates: { lat: 38.7876, lng: -9.3906 },
            googleMapsUrl: 'https://maps.google.com/?q=Pena+Palace+Sintra'
          },
          bookingUrl: 'https://www.parquesdesintra.pt/en/parks-monuments/park-and-national-palace-of-pena/',
          tips: ['Book online to skip the ticket line'],
          isFree: false
        },
        {
          id: 'd4-a3',
          time: '12:00',
          endTime: '13:00',
          type: 'restaurant',
          name: 'Lunch at Incomum',
          description: 'Modern Portuguese cuisine in Sintra town center. Great value lunch menu.',
          cost: 22,
          duration: '1h',
          location: {
            name: 'Incomum by Luis Santos',
            address: 'R. Dr. Alfredo Costa 22, Sintra',
            coordinates: { lat: 38.7972, lng: -9.3908 },
            googleMapsUrl: 'https://maps.google.com/?q=Incomum+Sintra'
          },
          isFree: false
        },
        {
          id: 'd4-a4',
          time: '13:30',
          endTime: '15:30',
          type: 'attraction',
          name: 'Quinta da Regaleira',
          description: 'Mystical estate with initiatic wells, grottos, and secret passages.',
          cost: 10,
          duration: '2h',
          location: {
            name: 'Quinta da Regaleira',
            address: 'R. Barbosa du Bocage 5, Sintra',
            coordinates: { lat: 38.7966, lng: -9.3959 },
            googleMapsUrl: 'https://maps.google.com/?q=Quinta+da+Regaleira'
          },
          bookingUrl: 'https://www.regaleira.pt/',
          tips: ['The Initiation Well is the highlight - go all the way down'],
          isFree: false
        },
        {
          id: 'd4-a5',
          time: '16:00',
          endTime: '17:00',
          type: 'attraction',
          name: 'Moorish Castle',
          description: 'Walk the ancient walls for incredible views of Sintra and the ocean.',
          cost: 8,
          duration: '1h',
          location: {
            name: 'Castelo dos Mouros',
            address: 'Estrada da Pena, Sintra',
            coordinates: { lat: 38.7925, lng: -9.3893 },
            googleMapsUrl: 'https://maps.google.com/?q=Castelo+dos+Mouros+Sintra'
          },
          isFree: false
        },
        {
          id: 'd4-a6',
          time: '17:30',
          endTime: '18:00',
          type: 'shopping',
          name: 'Queijadas at Piriquita',
          description: 'Famous bakery since 1862. Try queijadas (cheese tarts) and travesseiros.',
          cost: 6,
          duration: '30min',
          location: {
            name: 'Casa Piriquita',
            address: 'R. Padarias 1, Sintra',
            coordinates: { lat: 38.7973, lng: -9.3907 },
            googleMapsUrl: 'https://maps.google.com/?q=Casa+Piriquita+Sintra'
          },
          isFree: false
        },
        {
          id: 'd4-a7',
          time: '18:30',
          endTime: '19:15',
          type: 'transport',
          name: 'Train back to Lisbon',
          description: 'Return to Rossio Station. Rest your feet - you\'ve walked a lot today!',
          cost: 4.50,
          duration: '45min',
          location: {
            name: 'Sintra Train Station',
            address: 'Av. Dr. Miguel Bombarda, Sintra',
            coordinates: { lat: 38.7985, lng: -9.3859 }
          },
          isFree: false
        },
        {
          id: 'd4-a8',
          time: '20:00',
          endTime: '21:30',
          type: 'restaurant',
          name: 'Casual Dinner at Café de São Bento',
          description: 'Best steak in Lisbon. Try the prego no prato or the chateaubriand.',
          cost: 45,
          duration: '1h 30min',
          location: {
            name: 'Café de São Bento',
            address: 'R. de São Bento 212, Lisboa',
            coordinates: { lat: 38.7142, lng: -9.1509 },
            googleMapsUrl: 'https://maps.google.com/?q=Cafe+de+Sao+Bento+Lisbon'
          },
          isFree: false
        }
      ]
    },
    // DAY 5 - LX Factory, Departure
    {
      id: 'day-5',
      dayNumber: 5,
      date: getDateForDay(5, startDate),
      weather: { temp: 71, condition: 'sunny', icon: '☀️' },
      dailyBudget,
      proTips: [
        'LX Factory is best on weekends when the markets are open',
        'Allow 2 hours for airport check-in during peak season',
        'Pick up last-minute souvenirs: Vinho Verde, cork products, canned fish'
      ],
      activities: [
        {
          id: 'd5-a1',
          time: '09:00',
          endTime: '10:00',
          type: 'restaurant',
          name: 'Brunch at Landeau Chocolate',
          description: 'Famous for the best chocolate cake in Lisbon. Their brunch is equally good.',
          cost: 18,
          duration: '1h',
          location: {
            name: 'Landeau Chocolate',
            address: 'R. Rodrigues de Faria 103, Lisboa',
            coordinates: { lat: 38.7036, lng: -9.1782 },
            googleMapsUrl: 'https://maps.google.com/?q=Landeau+Chocolate+LX+Factory'
          },
          isFree: false
        },
        {
          id: 'd5-a2',
          time: '10:00',
          endTime: '12:30',
          type: 'shopping',
          name: 'Explore LX Factory',
          description: 'Creative hub in old factory. Bookshops, vintage stores, street art, craft shops.',
          cost: 30,
          duration: '2h 30min',
          location: {
            name: 'LX Factory',
            address: 'R. Rodrigues de Faria 103, Lisboa',
            coordinates: { lat: 38.7036, lng: -9.1782 },
            googleMapsUrl: 'https://maps.google.com/?q=LX+Factory+Lisbon'
          },
          tips: ['Check out Ler Devagar bookshop - one of the most beautiful in the world'],
          isFree: false
        },
        {
          id: 'd5-a3',
          time: '13:00',
          endTime: '14:00',
          type: 'restaurant',
          name: 'Final Lunch at Cantinho do Avillez',
          description: 'Chef José Avillez\'s casual bistro. Great for traditional Portuguese with a twist.',
          cost: 28,
          duration: '1h',
          location: {
            name: 'Cantinho do Avillez',
            address: 'R. dos Duques de Bragança 7, Lisboa',
            coordinates: { lat: 38.7100, lng: -9.1443 },
            googleMapsUrl: 'https://maps.google.com/?q=Cantinho+do+Avillez'
          },
          isFree: false
        },
        {
          id: 'd5-a4',
          time: '14:30',
          endTime: '15:30',
          type: 'free-time',
          name: 'Last-minute Souvenir Shopping',
          description: 'Pick up ginjinha, canned sardines, cork accessories, and azulejo tiles.',
          cost: 40,
          duration: '1h',
          location: {
            name: 'A Vida Portuguesa',
            address: 'Rua Anchieta 11, Chiado, Lisboa',
            coordinates: { lat: 38.7106, lng: -9.1408 },
            googleMapsUrl: 'https://maps.google.com/?q=A+Vida+Portuguesa+Lisbon'
          },
          tips: ['A Vida Portuguesa has beautifully packaged traditional Portuguese products'],
          isFree: false
        },
        {
          id: 'd5-a5',
          time: '16:00',
          endTime: '16:30',
          type: 'hotel',
          name: 'Hotel Check-out',
          description: 'Collect your luggage and say goodbye to your home away from home.',
          cost: 0,
          duration: '30min',
          location: {
            name: 'Hotel Baixa',
            address: 'Praça do Comércio, Baixa, Lisboa',
            coordinates: { lat: 38.7075, lng: -9.1364 }
          },
          isFree: true
        },
        {
          id: 'd5-a6',
          time: '17:00',
          endTime: '17:45',
          type: 'transport',
          name: 'Metro to Airport',
          description: 'Take the Green Line to Alameda, then Red Line to Aeroporto.',
          cost: 3,
          duration: '45min',
          location: {
            name: 'Baixa-Chiado Metro Station',
            address: 'Largo do Chiado, Lisboa',
            coordinates: { lat: 38.7105, lng: -9.1400 }
          },
          isFree: false
        },
        {
          id: 'd5-a7',
          time: '18:00',
          endTime: '20:30',
          type: 'flight',
          name: 'Check-in & Depart',
          description: 'Clear security and grab one last pastel de nata at the airport. Até logo, Lisboa!',
          cost: 0,
          duration: '2h 30min',
          location: {
            name: 'Lisbon Airport',
            address: 'Alameda das Comunidades Portuguesas, Lisboa',
            coordinates: { lat: 38.7813, lng: -9.1359 },
            googleMapsUrl: 'https://maps.google.com/?q=Lisbon+Airport'
          },
          isFree: true
        }
      ]
    }
  ];

  return days;
};

// Calculate totals for a day
export const getDayTotals = (day: DayPlan): { spent: number; remaining: number } => {
  const spent = day.activities.reduce((sum, activity) => sum + activity.cost, 0);
  return {
    spent,
    remaining: day.dailyBudget - spent
  };
};

// Calculate trip totals
export const getTripTotals = (days: DayPlan[]): { totalSpent: number; byCategory: Record<string, number> } => {
  const byCategory: Record<string, number> = {
    flights: 0,
    accommodation: 0,
    activities: 0,
    food: 0,
    transportation: 0,
  };

  let totalSpent = 0;

  days.forEach(day => {
    day.activities.forEach(activity => {
      totalSpent += activity.cost;
      
      switch (activity.type) {
        case 'flight':
          byCategory.flights += activity.cost;
          break;
        case 'hotel':
          byCategory.accommodation += activity.cost;
          break;
        case 'restaurant':
          byCategory.food += activity.cost;
          break;
        case 'transport':
          byCategory.transportation += activity.cost;
          break;
        default:
          byCategory.activities += activity.cost;
      }
    });
  });

  return { totalSpent, byCategory };
};

// Create a generic itinerary for any destination
export interface GenericPOI {
  name: string;
  address: string;
  coordinates?: { lat: number; lng: number } | null;
  mapsUrl?: string;
  estimatedCost?: number;
  rating?: number | null;
  reviews?: number | null;
  thumbnail?: string | null;
}

export interface GenericItineraryPOIs {
  attractions?: GenericPOI[];
  restaurants?: GenericPOI[];
  museums?: GenericPOI[];
}

export const createGenericItinerary = (
  destination: { name: string; country: string; coordinates: { lat: number; lng: number } },
  startDate: Date,
  numDays: number,
  dailyBudget: number,
  pois?: GenericItineraryPOIs,
  weather?: { temp: number; condition: 'sunny' | 'partly-cloudy' | 'rainy' | 'cold' | 'hot'; icon: string },
): DayPlan[] => {
  const days: DayPlan[] = [];
  const attractions = pois?.attractions || [];
  const restaurants = pois?.restaurants || [];
  const museums = pois?.museums || [];

  // Track usage counts so we prefer unused POIs first, only repeating when the
  // pool is exhausted. Avoids the "La Bocca x3 / Trattoria Carmen x3" problem.
  const usage = new Map<string, number>();
  const usedKey = (name?: string) => (name || '').toLowerCase().trim();

  const pickLeastUsed = <T extends GenericPOI>(pool: T[]): T | undefined => {
    if (pool.length === 0) return undefined;
    let best: T | undefined;
    let bestCount = Infinity;
    for (const p of pool) {
      const c = usage.get(usedKey(p.name)) || 0;
      if (c < bestCount) {
        best = p;
        bestCount = c;
      }
    }
    if (best) usage.set(usedKey(best.name), (usage.get(usedKey(best.name)) || 0) + 1);
    return best;
  };

  const pickAttraction = () => pickLeastUsed(attractions);
  const pickRestaurant = () => pickLeastUsed(restaurants);
  const pickMuseum = () => pickLeastUsed(museums) || pickAttraction();

  const locFromPOI = (poi: GenericPOI | undefined, fallbackName: string) => ({
    name: poi?.name || fallbackName,
    address: poi?.address || `${destination.name}, ${destination.country}`,
    coordinates: poi?.coordinates || destination.coordinates,
    googleMapsUrl: poi?.mapsUrl,
  });

  // Suggested day trips per destination (kept minimal and hint-only).
  const dayTripHints: Record<string, string[]> = {
    dubrovnik: ['Lokrum Island (ferry)', 'Kotor, Montenegro', 'Mostar, Bosnia', 'Elaphiti Islands'],
    lisbon: ['Sintra day trip', 'Cascais coast', 'Évora wine country'],
    barcelona: ['Montserrat', 'Girona & Costa Brava', 'Sitges beach town'],
    prague: ['Kutná Hora', 'Český Krumlov', 'Karlovy Vary spa town'],
    rome: ['Pompeii & Amalfi', 'Tivoli villas', 'Orvieto hill town'],
    paris: ['Versailles', 'Giverny (Monet gardens)', 'Champagne region'],
    athens: ['Delphi', 'Cape Sounion', 'Hydra island'],
    reykjavik: ['Golden Circle', 'South Coast waterfalls', 'Blue Lagoon'],
    marrakech: ['Atlas Mountains', 'Essaouira coast', 'Ourika Valley'],
  };
  const destKey = destination.name.toLowerCase();
  const trips = dayTripHints[destKey] || [];

  for (let i = 1; i <= numDays; i++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + i - 1);
    
    const activities: Activity[] = [];
    
    // Day 1: Travel + arrival day. Overnight flights from the Americas land
    // in Europe in the morning, but travelers are jet-lagged — keep it light.
    if (i === 1) {
      activities.push({
        id: `d${i}-a1`,
        time: '11:30',
        endTime: '13:00',
        type: 'flight',
        name: `Arrive at ${destination.name} Airport`,
        description: `Land after your overnight flight and clear customs. Grab bags and head to the hotel.`,
        cost: 0,
        duration: '1h 30min',
        location: {
          name: `${destination.name} Airport`,
          address: `${destination.name}, ${destination.country}`,
          coordinates: destination.coordinates,
        },
        isFree: true,
      });
      
      activities.push({
        id: `d${i}-a2`,
        time: '13:30',
        endTime: '14:30',
        type: 'transport',
        name: 'Transfer to hotel',
        description: 'Taxi or airport shuttle into town.',
        cost: 25,
        duration: '1h',
        location: {
          name: 'City center',
          address: `${destination.name}, ${destination.country}`,
          coordinates: destination.coordinates,
        },
        isFree: false,
      });

      activities.push({
        id: `d${i}-a3`,
        time: '14:30',
        endTime: '15:30',
        type: 'hotel',
        name: 'Hotel check-in',
        description: 'Drop bags, freshen up, short nap to shake off jet lag.',
        cost: 0,
        duration: '1h',
        location: {
          name: 'Hotel',
          address: `City Center, ${destination.name}`,
          coordinates: destination.coordinates,
        },
        isFree: true,
      });
      
      {
        const a = pickAttraction();
        activities.push({
          id: `d${i}-a4`,
          time: '16:30',
          endTime: '18:30',
          type: 'attraction',
          name: a?.name ? `Easy stroll: ${a.name}` : `Neighborhood stroll in ${destination.name}`,
          description: a?.name
            ? `Get oriented with a light walk around ${a.name}. Save the deep sightseeing for tomorrow.`
            : `Get oriented with a light walk around the historic center of ${destination.name}.`,
          cost: a?.estimatedCost ?? 0,
          duration: '2h',
          location: locFromPOI(a, 'City Center'),
          bookingUrl: a?.mapsUrl,
          isFree: !a?.estimatedCost,
        });
      }

      {
        const r = pickRestaurant();
        activities.push({
          id: `d${i}-a5`,
          time: '19:30',
          endTime: '21:00',
          type: 'restaurant',
          name: r?.name ? `Early dinner at ${r.name}` : 'Early welcome dinner',
          description: r?.name
            ? `First taste of local cuisine at ${r.name}${r.rating ? ` (${r.rating}★)` : ''}. Turn in early to reset your clock.`
            : `First taste of local cuisine. Turn in early to reset your clock.`,
          cost: r?.estimatedCost ? r.estimatedCost * 2 : Math.round(dailyBudget * 0.18),
          duration: '1h 30min',
          location: locFromPOI(r, 'Restaurant'),
          bookingUrl: r?.mapsUrl,
          isFree: false,
        });
      }
    }

    // Last day: Departure
    else if (i === numDays) {
      activities.push({
        id: `d${i}-a1`,
        time: '09:00',
        endTime: '10:00',
        type: 'restaurant',
        name: 'Breakfast',
        description: 'Enjoy a final breakfast before heading to the airport.',
        cost: Math.round(dailyBudget * 0.1),
        duration: '1h',
        location: {
          name: 'Hotel or Café',
          address: `${destination.name}, ${destination.country}`,
          coordinates: destination.coordinates,
        },
        isFree: false,
      });
      
      activities.push({
        id: `d${i}-a2`,
        time: '10:30',
        endTime: '11:00',
        type: 'hotel',
        name: 'Hotel Check-out',
        description: 'Check out and prepare for departure.',
        cost: 0,
        duration: '30min',
        location: {
          name: 'Hotel',
          address: `${destination.name}, ${destination.country}`,
          coordinates: destination.coordinates,
        },
        isFree: true,
      });
      
      activities.push({
        id: `d${i}-a3`,
        time: '11:30',
        endTime: '12:30',
        type: 'transport',
        name: 'Transfer to Airport',
        description: 'Head to the airport for your departure flight.',
        cost: Math.round(dailyBudget * 0.05),
        duration: '1h',
        location: {
          name: `${destination.name} Airport`,
          address: `${destination.name}, ${destination.country}`,
          coordinates: destination.coordinates,
        },
        isFree: false,
      });
      
      activities.push({
        id: `d${i}-a4`,
        time: '14:00',
        endTime: '16:00',
        type: 'flight',
        name: 'Departure Flight',
        description: `Board your return flight from ${destination.name}.`,
        cost: 0,
        duration: '2h+',
        location: {
          name: `${destination.name} Airport`,
          address: `${destination.name}, ${destination.country}`,
          coordinates: destination.coordinates,
        },
        isFree: true,
      });
    }
    // Day-trip day: for trips 6+ days, insert a suggested day trip every ~4th
    // day (days 4, 8, 12…) so long stays don't repeat the same city venues.
    else if (numDays >= 6 && trips.length > 0 && i >= 4 && (i - 4) % 4 === 0 && i < numDays - 1) {
      const trip = trips[Math.floor((i - 4) / 4) % trips.length];
      activities.push({
        id: `d${i}-a1`,
        time: '08:30',
        endTime: '09:30',
        type: 'restaurant',
        name: 'Early breakfast',
        description: 'Grab breakfast and coffee before heading out.',
        cost: Math.round(dailyBudget * 0.08),
        duration: '1h',
        location: {
          name: 'Café',
          address: `${destination.name}, ${destination.country}`,
          coordinates: destination.coordinates,
        },
        isFree: false,
      });
      activities.push({
        id: `d${i}-a2`,
        time: '10:00',
        endTime: '17:00',
        type: 'tour',
        name: `Day trip: ${trip}`,
        description: `Escape the city with a full-day trip to ${trip}. Book a guided tour or use public transport — plan ~7 hours door to door.`,
        cost: Math.round(dailyBudget * 0.35),
        duration: '7h',
        location: {
          name: trip,
          address: trip,
          coordinates: destination.coordinates,
          googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trip)}`,
        },
        bookingUrl: `https://www.google.com/search?q=${encodeURIComponent(trip + ' day trip from ' + destination.name)}`,
        tips: ['Book tours a day in advance in peak season', 'Bring water, sunscreen, and cash'],
        isFree: false,
      });
      {
        const r = pickRestaurant();
        activities.push({
          id: `d${i}-a3`,
          time: '19:30',
          endTime: '21:30',
          type: 'restaurant',
          name: r?.name ? `Late dinner at ${r.name}` : 'Late dinner back in town',
          description: r?.name
            ? `Unwind with dinner at ${r.name}${r.rating ? ` (${r.rating}★)` : ''}.`
            : `Unwind with dinner back in ${destination.name}.`,
          cost: r?.estimatedCost ? r.estimatedCost * 2 : Math.round(dailyBudget * 0.18),
          duration: '2h',
          location: locFromPOI(r, 'Restaurant'),
          bookingUrl: r?.mapsUrl,
          isFree: false,
        });
      }
    }
    // Regular days: sightseeing
    else {

      activities.push({
        id: `d${i}-a1`,
        time: '09:00',
        endTime: '10:00',
        type: 'restaurant',
        name: 'Breakfast',
        description: 'Start your day with a hearty breakfast.',
        cost: Math.round(dailyBudget * 0.08),
        duration: '1h',
        location: {
          name: 'Café',
          address: `${destination.name}, ${destination.country}`,
          coordinates: destination.coordinates,
        },
        isFree: false,
      });
      
      {
        const a = pickAttraction();
        activities.push({
          id: `d${i}-a2`,
          time: '10:30',
          endTime: '13:00',
          type: 'attraction',
          name: a?.name ? `Morning at ${a.name}` : `Morning Sightseeing in ${destination.name}`,
          description: a?.name
            ? `Explore ${a.name}${a.rating ? ` (${a.rating}★, ${a.reviews ?? 0} reviews)` : ''}.`
            : `Explore popular attractions and landmarks in ${destination.name}.`,
          cost: a?.estimatedCost ?? Math.round(dailyBudget * 0.15),
          duration: '2h 30min',
          location: locFromPOI(a, 'Local Attractions'),
          bookingUrl: a?.mapsUrl,
          isFree: !a?.estimatedCost,
        });
      }

      {
        const r = pickRestaurant();
        activities.push({
          id: `d${i}-a3`,
          time: '13:30',
          endTime: '15:00',
          type: 'restaurant',
          name: r?.name ? `Lunch at ${r.name}` : 'Lunch',
          description: r?.name
            ? `Enjoy lunch at ${r.name}${r.rating ? ` (${r.rating}★)` : ''}.`
            : `Enjoy lunch at a recommended local spot in ${destination.name}.`,
          cost: Math.round(dailyBudget * 0.12),
          duration: '1h 30min',
          location: locFromPOI(r, 'Restaurant'),
          bookingUrl: r?.mapsUrl,
          isFree: false,
        });
      }

      {
        const m = pickMuseum();
        activities.push({
          id: `d${i}-a4`,
          time: '15:30',
          endTime: '18:00',
          type: 'museum',
          name: m?.name ? `Visit ${m.name}` : 'Afternoon Activity',
          description: m?.name
            ? `${m.name}${m.rating ? ` — ${m.rating}★` : ''}.`
            : `Visit a museum, gallery, or unique attraction in ${destination.name}.`,
          cost: m?.estimatedCost ?? Math.round(dailyBudget * 0.1),
          duration: '2h 30min',
          location: locFromPOI(m, 'Museum or Gallery'),
          bookingUrl: m?.mapsUrl,
          isFree: !m?.estimatedCost,
        });
      }

      activities.push({
        id: `d${i}-a5`,
        time: '18:30',
        endTime: '19:30',
        type: 'free-time',
        name: 'Free Time',
        description: 'Relax, explore on your own, or rest at the hotel.',
        cost: 0,
        duration: '1h',
        location: {
          name: 'City Center',
          address: `${destination.name}, ${destination.country}`,
          coordinates: destination.coordinates,
        },
        isFree: true,
      });

      {
        const r = pickRestaurant();
        activities.push({
          id: `d${i}-a6`,
          time: '20:00',
          endTime: '22:00',
          type: 'restaurant',
          name: r?.name ? `Dinner at ${r.name}` : 'Dinner',
          description: r?.name
            ? `Savor dinner at ${r.name}${r.rating ? ` (${r.rating}★)` : ''}.`
            : `Savor dinner at a popular restaurant in ${destination.name}.`,
          cost: Math.round(dailyBudget * 0.2),
          duration: '2h',
          location: locFromPOI(r, 'Restaurant'),
          bookingUrl: r?.mapsUrl,
          isFree: false,
        });
      }
    }
    
    days.push({
      id: `day-${i}`,
      dayNumber: i,
      date: dayDate,
      weather: weather ?? { temp: 72, condition: 'sunny', icon: '☀️' },
      dailyBudget,
      proTips: [
        `Explore ${destination.name} like a local by walking the neighborhoods`,
        'Ask hotel staff for restaurant recommendations',
        'Keep some local currency for small purchases',
      ],
      activities,
    });
  }
  
  return days;
};
