<template>
  <component :is="comp" :size="size" :stroke-width="strokeWidth" :class="['icon', { spin }]" />
</template>

<script>
import {
  // navigation / ui
  X, ChevronLeft, ChevronRight, Menu, Star, Bookmark, BookmarkPlus,
  ArrowLeft, ArrowUpRight, ExternalLink, Search, Filter, Info,
  AlertTriangle, Loader2, MapPin, Map as MapIcon, Compass, List,
  // POI types
  Mountain, MountainSnow, Droplet, Droplets, Trees, Castle, Church,
  Landmark, Building2, Camera, Tent, Eye, Sparkles, Pyramid, Waves,
  Cross, Hammer, Flag, BookOpen,
  // Actions
  Car, Footprints, Navigation2, Phone, Globe, Hotel, Home,
  Coffee, BedDouble,
  // Transport
  TrainFront, Bus, Plane, TramFront
} from '@lucide/vue';

const MAP = {
  // nav/ui
  x: X, back: ArrowLeft, chevronLeft: ChevronLeft, chevronRight: ChevronRight,
  menu: Menu, star: Star, bookmark: Bookmark, bookmarkPlus: BookmarkPlus,
  externalLink: ExternalLink, arrowUpRight: ArrowUpRight, search: Search,
  filter: Filter, info: Info, warn: AlertTriangle, loader: Loader2,
  mapPin: MapPin, map: MapIcon, compass: Compass, list: List,

  // POI
  peak: Mountain, mountain: MountainSnow,
  waterfall: Droplets, river: Waves, lake: Droplet,
  cave: Pyramid, viewpoint: Eye, museum: Landmark,
  artwork: Sparkles, castle: Castle, monastery: Church,
  ruins: Hammer, monument: Flag, shrine: Cross, church: Church,
  attraction: MapPin, landmark: Landmark, park: Trees,
  meadow: Trees, valley: Trees, pass: Compass, lift: MountainSnow,
  resort: MountainSnow, spa: Sparkles, rocks: Mountain,
  market: Building2, photo: Camera, wiki: BookOpen,

  // actions / lodging
  car: Car, foot: Footprints, navigate: Navigation2,
  phone: Phone, globe: Globe,
  hotel: Hotel, guest_house: Home, hostel: BedDouble,
  apartment: Home, chalet: Home, camp_site: Tent,
  motel: Hotel, alpine_hut: Home,
  coffee: Coffee,

  // transport
  train_station: TrainFront, train_halt: TramFront,
  bus_station: Bus, airport: Plane,
  train: TrainFront, bus: Bus, plane: Plane
};

export default {
  name: 'Icon',
  props: {
    name: { type: String, required: true },
    size: { type: [Number, String], default: 18 },
    strokeWidth: { type: [Number, String], default: 2 },
    spin: { type: Boolean, default: false }
  },
  computed: {
    comp() {
      return MAP[this.name] || MapPin;
    }
  }
};
</script>

<style scoped>
.icon {
  vertical-align: middle;
  flex-shrink: 0;
}
.icon.spin {
  animation: icon-spin 0.9s linear infinite;
}
@keyframes icon-spin {
  to { transform: rotate(360deg); }
}
</style>
