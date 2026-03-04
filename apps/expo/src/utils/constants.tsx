import { Dimensions, Platform, ScaledSize } from "react-native";
import Bar from "~/assets/svg/bar";
import Cultural from '~/assets/svg/cultural';
import PrivateEvent from '~/assets/svg/private-event';
import SpeedIcon from "~/assets/svg/speed";
import ThisWeek from '~/assets/svg/this-week';
import Today from '~/assets/svg/today';
import Trending from '~/assets/svg/trending';


export const SOCKET_URL = "http://wssforevent.fly.dev/"
export const DEFAULT_USER = 'u0@foreventapp.com'
// export const DEFAULT_USER = 'francowerner-pc@hotmail.com'
// http://wssforevent.fly.dev

export const DEFAULT_ADMIN = 't0@foreventapp.com'

export const DEFAULT_CASHIER = 't1@foreventapp.com'

export const GUEST_USER = {
  id: undefined,
  sub: "GUEST",
  email: undefined,
  picture: undefined,
  given_name: undefined,
  family_name: undefined,
  birthdate: undefined,
  locale: undefined
}

// export const ADMIN_CATEGORIES = [
//   // {
//   //   name: 'Eventos',
//   //   icon: Events,
//   //   color: '#a3a3a3',
//   //   navigate: 'admin/event/see',
//   // },
//   {
//     name: 'Ubicaciones',
//     icon: Location,
//     color: '#00aaff',
//     navigate: 'admin/location/see',
//   },
//   {
//     name: 'Productos',
//     icon: Product,
//     color: '#059669',
//     navigate: 'admin/product/see',
//   },
//   {
//     name: 'Ventas',
//     icon: Sales,
//     color: '#be185d',
//     navigate: 'admin/purchases/see',
//   },
//   // {
//   //   name: 'Promociones',
//   //   icon: Deal,
//   //   color: '#c2410c',
//   //   navigate: 'admin/deal/see',
//   // },
//   {
//     name: 'Tickets',
//     icon: Ticket,
//     color: '#c084fc',
//     navigate: 'admin/ticket/see',
//   },
//   {
//     name: 'Empleados',
//     icon: Employee,
//     color: '#fde047',
//     navigate: 'admin/employee/see',
//   },
//   // {
//   //   name: 'Cultura',
//   //   icon: 'palette-outline',
//   //   color: '#fde047',
//   //   navigate: 'event/list'
//   // },
// ]


export const USER_CATEGORIES = [
  {
    name: "TRENDING",
    title: 'Tendencias',
    icon: Trending,
    color: '#ffb852',
    about: 'Eventos más populares',
    navigate: `user/event/category/TRENDING`
  },
  {
    name: "SPEED",
    title: 'Speed',
    icon: SpeedIcon,
    color: '#db0000',
    about: 'Eventos auspiciados por speed',
    navigate: `user/event/category/SPEED`
  },
  {
    name: "TONIGHT",
    title: 'Hoy',
    icon: Today,
    color: '#ff00ff',
    about: 'Eventos que transcurrirán hoy',
    navigate: `user/event/category/TONIGHT`
  },
  {
    name: "THISWEEK",
    title: 'Esta semana',
    icon: ThisWeek,
    color: '#ff0094',
    about: 'Eventos que transcurren esta semana',
    navigate: `user/event/category/THISWEEK`
  },
  {
    name: "PRIVATE",
    title: 'Fiestas privadas',
    icon: PrivateEvent,
    color: '#1a55ff',
    about: 'Eventos organizadas por usuarios de forevent',
    navigate: `user/event/category/PRIVATE`
  },
  {
    name: "CULTURAL",
    title: 'Cultural',
    icon: Cultural,
    color: '#b666d2',
    about: 'Eventos culturales',
    navigate: `user/event/category/CULTURAL`
  },
  {
    name: "BAR",
    title: 'Bares',
    icon: Bar,
    color: '#7e00ff',
    about: 'Bares cerca de tí',
    navigate: `user/event/category/BAR`
  },
]

export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

export const PW_REGEX = /^(?=.* [0 - 9])(?=.* [a - z])(?=.* [A - Z]).{8, 32}$/;

export const PLACEHOLDER = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/1200px-Placeholder_view_vector.svg.png"

export const TEST_IMAGE_URL = "https://myassistancetestbucket122302-test.s3.sa-east-1.amazonaws.com/public/"

export const IMAGE_URL = "https://myassistancedev-storage111404-dev.s3.sa-east-1.amazonaws.com/public/"

export const DEV_IMAGE_URL = "https://myassistancedev-storage111404-dev.s3.sa-east-1.amazonaws.com/public/"



export const MAP_STYLE = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#bdbdbd"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#181818"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1b1b1b"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#2c2c2c"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#8a8a8a"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#373737"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#3c3c3c"
      }
    ]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#4e4e4e"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#000000"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#3d3d3d"
      }
    ]
  }
]

export const dayjs = require('dayjs-with-plugins');

export const IANA = dayjs.tz.guess()

export const DEFAULT_ARTIST = {
  name: 'Nombre del artista',
  avatar: "https://thumbs.dreamstime.com/b/hombre-gris-del-placeholder-de-la-foto-persona-gen%C3%A9rica-silueta-en-un-fondo-blanco-144511705.jpg"
}

export const DEFAULT_LOCATION = {
  id: undefined,
  latitude: 0,
  longitude: 0,
  city: 'Ciudad',
  name: 'Seleccionar ubicación',
  avatar: 'https://atlas-content-cdn.pixelsquid.com/stock-images/black-placeholder-for-map-cursor-4Gv0XV3-600.jpg',
  address: 'Direccion del lugar',
  iana: 'GMT',
  country: 'País'
}

export const DEFAULT_COORDS = {
  latitude: 0,
  longitude: 0
}

export const DEFAULT_COLORS = {
  average: "rgba(0,0,0,0)",
  dominant: "rgba(0,0,0,0)",
  darkMuted: "rgba(0,0,0,0)",
  darkVibrant: "rgba(0,0,0,0)",
  lightMuted: "rgba(0,0,0,0)",
  lightVibrant: "rgba(0,0,0,0)",
  muted: "rgba(0,0,0,0)",
  vibrant: "rgba(0,0,0,0)",
}

export const ElementsText = {
  AUTOPLAY: "AutoPlay",
};

export const isIos = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";
export const isWeb = Platform.OS === "web";

export const window: ScaledSize = isWeb
  ? {
    ...Dimensions.get("window"),
    width: 375,
  }
  : Dimensions.get("window");

export const cameraPermission = async () => {
  // let targetPermission = Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA
  // let result = "";
  // check(targetPermission).then(res => {
  //   switch (res) {
  //     case RESULTS.DENIED:
  //       // console.log('CAMERA: Denied, requesting permission! 11')
  //       request(targetPermission).then(
  //         resp => {
  //           if (resp === 'granted') {
  //             // console.log('CAMERA: Permission granted! 15')
  //             result = RESULTS.GRANTED
  //           }
  //         },
  //         err => { console.error(err) })
  //       result = "RESULTS.DENIED"
  //       // console.log(result, "RESULT 1")
  //       break

  //     case RESULTS.GRANTED:
  //       // console.log('CAMERA: Permission granted! 37')
  //       result = "RESULTS.GRANTED";
  //       // console.log(result, "RESULT 2")
  //       break

  //     case RESULTS.UNAVAILABLE:
  //       // console.log('CAMERA: This feature is not available (on this device / in this context) 42');
  //       result = "RESULTS.UNAVAILABLE";
  //       // console.log(result, "RESULT 3")
  //       break

  //     case RESULTS.LIMITED:
  //       // console.log('CAMERA: The permission is limited: some actions are possible 46');
  //       result = "RESULTS.LIMITED";
  //       // console.log(result, "RESULT 4")
  //       break

  //     case RESULTS.BLOCKED:

  //       // console.log('CAMERA: The permission is denied and not requestable anymore 50');
  //       result = "RESULTS.BLOCKED";
  //       // console.log(result, "RESULT 5")
  //       break

  //     default:
  //       // console.error('CAMERA: FAILED TO GET PERMISSION 54')
  //       result = "RESULTS.FAILED";
  //     // console.log(result, "RESULT 6")
  //   }
  // }).catch(error => {
  //   // console.error(error.message)
  // })
  // // console.log(result, "RESULT 7")
  // return result
}

export const PAGE_WIDTH = Dimensions.get('window').width;

export const PAGE_HEIGHT = Dimensions.get('window').height;

export const defaultDetailedLocation = { city: undefined, country: undefined, full_address: undefined, latitude: undefined, longitude: undefined, province: undefined, street: undefined, street_number: undefined, name: undefined }

export const blurhash = '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';
