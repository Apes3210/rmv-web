import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Armchair,
  ArrowRight,
  ArrowUpFromLine,
  BadgeCheck,
  BookOpen,
  ChefHat,
  Clock,
  DoorClosed,
  DoorOpen,
  Drill,
  Fence,
  Frame,
  Grid3x3,
  Handshake,
  Layers,
  Mail,
  MapPin,
  Navigation,
  PenTool,
  Phone,
  ShieldCheck,
  Umbrella,
  Utensils,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { LocationView } from '@/components/maps/LocationView';
import { useAuthStore } from '@/stores/auth.store';
import { ServiceType, SERVICE_TYPE_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

type LandingService = {
  type: ServiceType;
  label: string;
  imageUrl: string;
  description: string;
  Icon: LucideIcon;
};

type GalleryGroup = 'all' | 'kitchen' | 'food-stall' | 'gasline' | 'custom';

type ServiceSpecItem = {
  label: string;
  value: string;
  note?: string;
  required?: boolean;
};

type ServiceSpecGroup = {
  title: string;
  items: ServiceSpecItem[];
};

type ServiceDetailMetadata = {
  fullDescription: string;
  specGroups: ServiceSpecGroup[];
  estimatedPrice: string;
  priceNote: string;
};

const SERVICE_IMAGE_PATHS: Record<ServiceType, string> = {
  [ServiceType.RAILINGS]: '/landing/services/railings.png',
  [ServiceType.GRILLS]: '/landing/services/grills.png',
  [ServiceType.GATES]: '/landing/services/gates.png',
  [ServiceType.FENCES]: '/landing/services/fences.png',
  [ServiceType.KITCHEN_COUNTER]: '/landing/services/kitchen-counter.png',
  [ServiceType.KITCHEN_CABINET]: '/landing/services/kitchen-cabinet.png',
  [ServiceType.TABLE]: '/landing/services/table.png',
  [ServiceType.CHAIR]: '/landing/services/chair.png',
  [ServiceType.SHELVING]: '/landing/services/shelving.png',
  [ServiceType.DOOR]: '/landing/services/door.png',
  [ServiceType.WINDOW_FRAME]: '/landing/services/window-frame.png',
  [ServiceType.CANOPY]: '/landing/services/canopy.png',
  [ServiceType.STAIRCASE]: '/landing/services/staircase.png',
  [ServiceType.BALUSTRADE]: '/landing/services/balustrade.png',
  [ServiceType.SIGNAGE]: '/landing/services/signage.png',
  [ServiceType.CUSTOM]: '/landing/services/custom.png',
};

const SERVICE_ICONS: Record<ServiceType, LucideIcon> = {
  [ServiceType.RAILINGS]: Fence,
  [ServiceType.GRILLS]: Grid3x3,
  [ServiceType.GATES]: DoorOpen,
  [ServiceType.FENCES]: Fence,
  [ServiceType.KITCHEN_COUNTER]: Utensils,
  [ServiceType.KITCHEN_CABINET]: ChefHat,
  [ServiceType.TABLE]: BookOpen,
  [ServiceType.CHAIR]: Armchair,
  [ServiceType.SHELVING]: Layers,
  [ServiceType.DOOR]: DoorClosed,
  [ServiceType.WINDOW_FRAME]: Frame,
  [ServiceType.CANOPY]: Umbrella,
  [ServiceType.STAIRCASE]: ArrowUpFromLine,
  [ServiceType.BALUSTRADE]: Fence,
  [ServiceType.SIGNAGE]: PenTool,
  [ServiceType.CUSTOM]: Wrench,
};

const SERVICE_DESCRIPTIONS: Record<ServiceType, string> = {
  [ServiceType.RAILINGS]: 'Stainless railings for balconies, stairs, and safety edges.',
  [ServiceType.GRILLS]: 'Protective metal grills for openings, storefronts, and homes.',
  [ServiceType.GATES]: 'Custom steel gates built for security, access, and style.',
  [ServiceType.FENCES]: 'Durable fences for residential, commercial, and perimeter needs.',
  [ServiceType.KITCHEN_COUNTER]: 'Stainless counters for prep, service, and daily kitchen use.',
  [ServiceType.KITCHEN_CABINET]: 'Built-in stainless cabinets for organized kitchen storage.',
  [ServiceType.TABLE]: 'Work tables and dining tables fabricated to size.',
  [ServiceType.CHAIR]: 'Metal seating frames and custom chair fabrication.',
  [ServiceType.SHELVING]: 'Strong shelving for kitchens, stockrooms, and display areas.',
  [ServiceType.DOOR]: 'Metal and stainless doors for access, utility, and security.',
  [ServiceType.WINDOW_FRAME]: 'Window frames made for clean fit, strength, and finish.',
  [ServiceType.CANOPY]: 'Canopies for storefront shade, weather cover, and entries.',
  [ServiceType.STAIRCASE]: 'Steel stair systems for homes, shops, and commercial spaces.',
  [ServiceType.BALUSTRADE]: 'Balustrades with polished safety and architectural finish.',
  [ServiceType.SIGNAGE]: 'Fabricated signage frames and branded metal installations.',
  [ServiceType.CUSTOM]: 'Custom stainless and metal works built to your project specs.',
};

const SERVICE_QUOTE_DISCLAIMER =
  'Final quotation depends on actual measurements, material grade/thickness, finish, and installation requirements.';

const SERVICE_DETAIL_METADATA: Partial<Record<ServiceType, ServiceDetailMetadata>> = {
  [ServiceType.KITCHEN_COUNTER]: {
    fullDescription:
      'Fabricated stainless kitchen counters for prep, washing, service, and daily commercial or home kitchen use. Built around your working layout, plumbing points, cutouts, and preferred finish.',
    specGroups: [
      {
        title: 'Measurements',
        items: [
          { label: 'Counter Length', value: '4 ft – 12 ft+', note: 'Maps to counterLength. Include straight, L-shape, or U-shape runs.', required: true },
          { label: 'Counter Width / Depth', value: '24 in – 30 in', note: 'Maps to counterWidth. Verify appliance and walkway clearance.', required: true },
          { label: 'Counter Height', value: '34 in – 36 in', note: 'Maps to counterHeight. Can be adjusted for prep, service, or display use.', required: true },
          { label: 'Backsplash Height', value: '4 in – 12 in', note: 'Maps to backsplashHeight. Recommended near walls, prep, and sink zones.' },
          { label: 'Sink / Appliance Cutouts', value: 'As required', note: 'Maps to sinkCutout and applianceClearance. Fixture sizes must be confirmed.' },
        ],
      },
      {
        title: 'Material & Finish',
        items: [
          { label: 'Stainless Grade', value: 'SS304 food-grade typical', note: 'SS201 may fit budget builds; SS316 is better for corrosive or outdoor exposure.', required: true },
          { label: 'Thickness / Gauge', value: '1.0 mm – 1.5 mm+', note: 'Thicker material is recommended for sinks, heavy prep, and high-use counters.' },
          { label: 'Counter Finish', value: 'Hairline / brushed / satin', note: 'Maps to counterFinish. Brushed finishes hide daily use marks better.', required: true },
          { label: 'Edge Style', value: 'Hemmed / rounded / front lip', note: 'Maps to edgeStyle. Edge detail affects comfort, cleaning, and fabrication labor.' },
        ],
      },
      {
        title: 'Installation',
        items: [
          { label: 'Plumbing Nearby', value: 'Confirm if sink is included', note: 'Maps to plumbingNearby. Drain, faucet, and supply locations affect cutouts.' },
          { label: 'Electrical Nearby', value: 'Confirm if appliances sit on counter', note: 'Maps to electricalNearby and appliancePlacement.' },
          { label: 'Existing Cabinet Layout', value: 'Counter-only or with base', note: 'Maps to existingCabinetLayout. Existing supports may need adjustment.' },
          { label: 'Floor / Wall Condition', value: 'Tile or concrete preferred', note: 'Maps to floorType. Uneven surfaces may require leveling or shimming.' },
        ],
      },
      {
        title: 'Quote Requirements',
        items: [
          { label: 'Needed Before Quote', value: 'Site photos, rough sketch, sink specs, and measurements', note: 'Include wall-to-wall dimensions, plumbing points, and appliance sizes.', required: true },
          { label: 'Optional Add-ons', value: 'Sink bowl, undershelf, cabinet base, splash guard', note: 'Add-ons change material, labor, and installation scope.' },
        ],
      },
    ],
    estimatedPrice: 'Estimate starts around ₱18,000 - ₱65,000+.',
    priceNote:
      'Estimate-only range for standard stainless counter work; large layouts, thicker gauges, sink bowls, and installation complexity can increase cost.',
  },
  [ServiceType.KITCHEN_CABINET]: {
    fullDescription:
      'Custom stainless kitchen cabinets for organized storage, prep support, and heavy-use kitchen environments. Suitable for base cabinets, wall-mounted modules, shelves, and sliding or swing-door storage.',
    specGroups: [
      {
        title: 'Measurements',
        items: [
          { label: 'Cabinet Length', value: '3 ft – 12 ft+', note: 'Maps to cabinetLength. Based on wall run, base run, or kitchen zone.', required: true },
          { label: 'Cabinet Depth', value: '18 in – 24 in', note: 'Maps to cabinetDepth. Depends on storage depth and counter overhang.', required: true },
          { label: 'Cabinet Height', value: '30 in – 84 in', note: 'Maps to cabinetHeight. Base, overhead, or full-height cabinet options.', required: true },
          { label: 'Module Count', value: '1 – 6+ modules', note: 'Maps to moduleCount. Affects door count, divisions, and fabrication time.' },
          { label: 'Shelf Spacing', value: 'Adjustable or fixed', note: 'Maps to shelfSpacing. Confirm stored item height and load.' },
        ],
      },
      {
        title: 'Material & Finish',
        items: [
          { label: 'Body Material', value: 'SS201 / SS304 stainless body', note: 'Maps to bodyMaterial. SS304 is better for wet and food-prep areas.', required: true },
          { label: 'Thickness / Gauge', value: '0.8 mm – 1.5 mm+', note: 'Heavier cabinet use and larger doors benefit from thicker material.' },
          { label: 'Cabinet Finish', value: 'Hairline / brushed / satin', note: 'Maps to counterFinish. Finish affects cleaning and visible marks.', required: true },
          { label: 'Door Type', value: 'Swing / sliding / open shelf', note: 'Maps to doorType. Sliding doors need track clearance.' },
          { label: 'Handle / Lock', value: 'Pull handle, recessed handle, lock provision', note: 'Maps to handleType and lockProvision.' },
        ],
      },
      {
        title: 'Installation',
        items: [
          { label: 'Wall Support', value: 'Required for overhead cabinets', note: 'Maps to wallSupport. Wall material and anchors must be verified.' },
          { label: 'Plumbing / Electrical Nearby', value: 'Confirm for sink or appliance zones', note: 'Maps to plumbingNearby and electricalNearby.' },
          { label: 'Existing Cabinet Removal', value: 'Optional', note: 'Maps to existingCabinetRemoval. Removal affects labor and schedule.' },
          { label: 'Floor Level Condition', value: 'Verify before final fit', note: 'Maps to floorLevelCondition. Uneven floor affects alignment.' },
        ],
      },
      {
        title: 'Quote Requirements',
        items: [
          { label: 'Needed Before Quote', value: 'Module layout, photos, dimensions, door direction, shelf needs', note: 'Include wall support photos for overhead cabinets.', required: true },
          { label: 'Optional Add-ons', value: 'Locks, drawers, adjustable shelves, sink base, custom handles', note: 'Add-ons change hardware and fabrication cost.' },
        ],
      },
    ],
    estimatedPrice: 'Estimate starts around ₱25,000 - ₱95,000+.',
    priceNote:
      'Estimate-only range for cabinet modules; final cost depends on module count, doors, shelves, grade, finish, and site installation.',
  },
  [ServiceType.RAILINGS]: {
    fullDescription:
      'Stainless railings for balconies, stairs, ramps, landings, and safety edges. Designed for clean alignment, durable mounting, and a polished finish that fits residential or commercial spaces.',
    specGroups: [
      {
        title: 'Measurements',
        items: [
          { label: 'Total Run Length', value: '1 m – 20 m+', note: 'Maps to totalRunLength. Measure every stair, landing, balcony, and edge run.', required: true },
          { label: 'Rail Height', value: '900 mm – 1100 mm', note: 'Maps to railHeight. Final height depends on site and safety requirements.', required: true },
          { label: 'Post Spacing', value: '900 mm – 1200 mm', note: 'Maps to postSpacing. Adjusted for strength, layout, and substrate.', required: true },
          { label: 'Tube Diameter', value: '38 mm – 50 mm', note: 'Maps to tubeDiameter. Common handrail sizes are 1.5 in to 2 in.' },
          { label: 'Material Thickness', value: '1.2 mm – 2.0 mm+', note: 'Maps to materialThickness. Outdoor or high-traffic areas may need heavier gauge.' },
          { label: 'Section Count / Stair Alignment', value: 'Straight, landing + run, or custom', note: 'Maps to sectionCount and stairAlignment.' },
        ],
      },
      {
        title: 'Material & Finish',
        items: [
          { label: 'Tube Material', value: 'SS304 indoor / SS316 outdoor', note: 'Maps to tubeMaterial. SS316 is preferred for weather or corrosive exposure.', required: true },
          { label: 'Finish Type', value: 'Brushed satin / polished', note: 'Maps to finishType. Polished finish costs more and shows marks faster.', required: true },
          { label: 'Handrail Style', value: 'Round, square, horizontal, vertical', note: 'Maps to handrailStyle.' },
          { label: 'Baluster / Infill Style', value: 'Horizontal bars, vertical pickets, glass provision', note: 'Maps to balusterStyle.' },
        ],
      },
      {
        title: 'Installation',
        items: [
          { label: 'Mount Type', value: 'Surface mount / side mount / core drilled', note: 'Maps to mountType. Mounting method changes anchors and labor.' },
          { label: 'Mounting Surface', value: 'Concrete, steel, or mixed base', note: 'Maps to mountingSurface and baseMaterial.' },
          { label: 'Outdoor Exposure', value: 'Low / medium / high', note: 'Maps to outdoorExposure. Exposure affects grade and finish recommendation.' },
          { label: 'Balcony Edge Condition', value: 'Verify slab edge and waterproofing', note: 'Maps to balconyEdgeCondition.' },
        ],
      },
      {
        title: 'Quote Requirements',
        items: [
          { label: 'Needed Before Quote', value: 'Site edge photos, run lengths, safety height, mount surface', note: 'Include stair pitch and landing photos when applicable.', required: true },
          { label: 'Optional Add-ons', value: 'Glass clamps, decorative infill, heavy posts, custom caps', note: 'Add-ons affect material, welding, and finishing work.' },
        ],
      },
    ],
    estimatedPrice: 'Estimate starts around ₱3,500 - ₱9,500 per linear meter.',
    priceNote:
      'Estimate-only range for typical stainless railing runs; curves, glass, custom patterns, heavier posts, and difficult mounting may increase cost.',
  },
  [ServiceType.GATES]: {
    fullDescription:
      'Custom steel and stainless gates for secured access, storefronts, homes, and property entries. Built around your opening size, swing or sliding movement, panel style, and lock provisions.',
    specGroups: [
      {
        title: 'Measurements',
        items: [
          { label: 'Gate Width', value: '3 ft – 16 ft+', note: 'Maps to gateWidth. Measure clear opening from post to post.', required: true },
          { label: 'Gate Height', value: '4 ft – 7 ft+', note: 'Maps to gateHeight. Depends on privacy, security, and design preference.', required: true },
          { label: 'Opening Clearance', value: 'Confirm full swing or slide path', note: 'Maps to openingClearance. Sliding gates need track and side parking space.' },
          { label: 'Post Height', value: 'Based on gate height and footing', note: 'Maps to postHeight. Existing posts must be checked.' },
          { label: 'Panel Count', value: '1 – 2 panels', note: 'Maps to panelCount. Larger openings may need double swing or segmented panels.' },
        ],
      },
      {
        title: 'Material & Finish',
        items: [
          { label: 'Frame Material', value: 'Stainless, mild steel, or mixed metal', note: 'Maps to frameMaterial. Larger gates need heavier frame sections.', required: true },
          { label: 'Frame Tube', value: '1.5 in – 3 in', note: 'Heavier gates need larger tubes and stronger posts.' },
          { label: 'Panel Style', value: 'Horizontal bars, sheet panel, perforated, custom', note: 'Maps to panelStyle.' },
          { label: 'Paint / Finish Type', value: 'Brushed stainless / powder coat / painted', note: 'Maps to paintFinish.' },
          { label: 'Lock Type', value: 'Latch, dropbolt, lever lock, heavy-duty hardware', note: 'Maps to lockType.' },
        ],
      },
      {
        title: 'Installation',
        items: [
          { label: 'Motion Type', value: 'Swing / sliding', note: 'Maps to motionType. Sliding gates need wheel and track allowance.' },
          { label: 'Wheel Requirement', value: 'For sliding gates', note: 'Maps to wheelRequirement. Wheel size depends on weight and track.' },
          { label: 'Ground Slope', value: 'Flat / slight / steep', note: 'Maps to groundSlope. Slope affects swing clearance and track work.' },
          { label: 'Concrete Base', value: 'Confirm footing or existing slab', note: 'Maps to concreteBase.' },
          { label: 'Vehicle Clearance / Fence Connection', value: 'Confirm driveway and side connections', note: 'Maps to vehicleClearance and fenceConnection.' },
        ],
      },
      {
        title: 'Quote Requirements',
        items: [
          { label: 'Needed Before Quote', value: 'Opening photos, post-to-post size, height, slope, motion type', note: 'Include photos of posts, floor, driveway, and side clearance.', required: true },
          { label: 'Optional Add-ons', value: 'Automation provision, privacy panels, heavy locks, decorative inserts', note: 'Add-ons change hardware, electrical prep, and fabrication time.' },
        ],
      },
    ],
    estimatedPrice: 'Estimate starts around ₱28,000 - ₱120,000+.',
    priceNote:
      'Estimate-only range for custom gate fabrication; automation, large spans, decorative panels, and site preparation can increase cost.',
  },
  [ServiceType.CANOPY]: {
    fullDescription:
      'Fabricated canopies for storefront shade, entry protection, weather cover, and outdoor working areas. Built with structural supports and finish options matched to exposure and mounting conditions.',
    specGroups: [
      {
        title: 'Measurements',
        items: [
          { label: 'Projection Length', value: '2 ft – 8 ft+', note: 'Maps to projectionLength. This is how far the canopy extends outward.', required: true },
          { label: 'Total Width', value: '4 ft – 20 ft+', note: 'Maps to totalWidth. Based on storefront, entry, or covered work area.', required: true },
          { label: 'Height Clearance', value: '7 ft – 12 ft+', note: 'Maps to heightClearance. Confirm entrance, signage, and vehicle clearance.' },
          { label: 'Support Post Count', value: '0 – 4+ posts', note: 'Maps to supportPostCount. Wall-mounted canopies may not need front posts.' },
        ],
      },
      {
        title: 'Material & Finish',
        items: [
          { label: 'Roofing Material', value: 'Polycarbonate / metal / glass', note: 'Maps to roofingMaterial. Material affects heat, noise, weight, and price.', required: true },
          { label: 'Structural Material', value: 'Stainless, GI, or painted steel frame', note: 'Maps to structuralMaterial. Frame choice depends on span and exposure.', required: true },
          { label: 'Frame Size', value: '1.5 in – 3 in', note: 'Larger spans and wind exposure require heavier frame sections.' },
          { label: 'Finish Coating', value: 'Brushed stainless / powder coat / painted', note: 'Maps to finishCoating.' },
          { label: 'Drainage Style', value: 'Front gutter, side drain, or open edge', note: 'Maps to drainageStyle.' },
        ],
      },
      {
        title: 'Installation',
        items: [
          { label: 'Roof Connection Type', value: 'Wall anchor / fascia / post-supported', note: 'Maps to roofConnectionType. Wall structure must be verified.' },
          { label: 'Outdoor / Wind Exposure', value: 'Low / medium / high', note: 'Maps to outdoorExposure and windExposure. Exposure affects anchoring and frame size.' },
          { label: 'Drainage Access', value: 'Confirm water discharge route', note: 'Maps to drainageAccess.' },
          { label: 'Existing Support Structure', value: 'Concrete wall, beams, columns, or none', note: 'Maps to existingSupportStructure.' },
        ],
      },
      {
        title: 'Quote Requirements',
        items: [
          { label: 'Needed Before Quote', value: 'Facade photos, width, projection, wall material, drainage route', note: 'Include photos showing mounting points and overhead clearance.', required: true },
          { label: 'Optional Add-ons', value: 'Gutter, downspout, lighting provision, thicker frame, post footing', note: 'Add-ons affect structural and installation scope.' },
        ],
      },
    ],
    estimatedPrice: 'Estimate starts around ₱18,000 - ₱85,000+.',
    priceNote:
      'Estimate-only range for standard canopy work; roofing material, wind exposure, support structure, drainage, and installation access affect final cost.',
  },
  [ServiceType.CUSTOM]: {
    fullDescription:
      'Custom stainless and metal fabrication for special layouts, one-off fixtures, frames, displays, utility pieces, and site-specific requirements that do not fit a standard service category.',
    specGroups: [
      {
        title: 'Measurements',
        items: [
          { label: 'Primary Dimension', value: 'Project-specific', note: 'Maps to primaryDimension. Example: 2400 x 900 x 850 mm.', required: true },
          { label: 'Quantity', value: '1 pc – bulk order', note: 'Maps to quantity. Multiple pieces may reduce per-piece setup cost.' },
          { label: 'Component Count', value: 'Single item or multiple assemblies', note: 'Separate frames, panels, shelves, or brackets if needed.' },
          { label: 'Load / Use Requirement', value: 'Light, standard, or heavy-duty', note: 'Needed for material thickness and structural support decisions.' },
        ],
      },
      {
        title: 'Material & Finish',
        items: [
          { label: 'Material Preference', value: 'Stainless / steel / GI / aluminum / mixed metal', note: 'Maps to materialPreference. Material choice affects strength and price.', required: true },
          { label: 'Thickness / Gauge', value: '0.8 mm – 3.0 mm+', note: 'Depends on load, use, and durability target.' },
          { label: 'Finish Preference', value: 'Brushed / polished / painted / powder-coated / custom', note: 'Maps to finishPreference.' },
          { label: 'Design Direction', value: 'Reference style, sketch, or functional requirement', note: 'Maps to designDirection. Include design references when available.' },
        ],
      },
      {
        title: 'Installation',
        items: [
          { label: 'Installation Location', value: 'Indoor, outdoor, kitchen, storefront, utility area', note: 'Maps to installationLocation.' },
          { label: 'Mounting Points', value: 'Wall, floor, ceiling, counter, or freestanding', note: 'Needed to plan anchors and support.' },
          { label: 'Access Constraints', value: 'Narrow stairs, elevator limits, operating hours', note: 'Maps to accessConstraints. Access affects delivery and installation labor.' },
          { label: 'Installation Need', value: 'Optional / required', note: 'On-site installation adds labor and logistics.' },
        ],
      },
      {
        title: 'Quote Requirements',
        items: [
          { label: 'Needed Before Quote', value: 'Purpose, dimensions, quantity, material, finish, photos, sketch', note: 'Custom work needs enough detail to separate fabrication from installation scope.', required: true },
          { label: 'Optional Add-ons', value: 'Wheels, locks, lighting, glass, wood inserts, removable panels', note: 'Special features change hardware, finish, and fabrication sequence.' },
        ],
      },
    ],
    estimatedPrice: 'Estimate depends on approved scope; typical custom work starts around ₱10,000+.',
    priceNote:
      'Estimate-only starting point for simple custom fabrication; detailed drawings, materials, quantity, and installation requirements define the final quote.',
  },
};

const SERVICE_ORDER: ServiceType[] = [
  ServiceType.RAILINGS,
  ServiceType.GRILLS,
  ServiceType.GATES,
  ServiceType.FENCES,
  ServiceType.KITCHEN_COUNTER,
  ServiceType.KITCHEN_CABINET,
  ServiceType.TABLE,
  ServiceType.CHAIR,
  ServiceType.SHELVING,
  ServiceType.DOOR,
  ServiceType.WINDOW_FRAME,
  ServiceType.CANOPY,
  ServiceType.STAIRCASE,
  ServiceType.BALUSTRADE,
  ServiceType.SIGNAGE,
  ServiceType.CUSTOM,
];

const REAL_SERVICES: LandingService[] = SERVICE_ORDER.map((type) => ({
  type,
  label: SERVICE_TYPE_LABELS[type] ?? type,
  imageUrl: SERVICE_IMAGE_PATHS[type],
  description: SERVICE_DESCRIPTIONS[type],
  Icon: SERVICE_ICONS[type],
}));

const FEATURED_SERVICES = [
  ServiceType.KITCHEN_COUNTER,
  ServiceType.KITCHEN_CABINET,
  ServiceType.RAILINGS,
  ServiceType.GATES,
  ServiceType.CANOPY,
  ServiceType.CUSTOM,
].map((type) => REAL_SERVICES.find((service) => service.type === type)!);

const HERO_CHIPS = [
  ServiceType.RAILINGS,
  ServiceType.GATES,
  ServiceType.KITCHEN_COUNTER,
  ServiceType.KITCHEN_CABINET,
  ServiceType.CANOPY,
  ServiceType.CUSTOM,
].map((type) => REAL_SERVICES.find((service) => service.type === type)!);

const GALLERY_FILTERS: Array<{ key: GalleryGroup; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'food-stall', label: 'Food Stall' },
  { key: 'kitchen', label: 'Kitchen' },
  { key: 'gasline', label: 'Gasline' },
  { key: 'custom', label: 'Custom' },
];

const COMPLETED_WORKS = [
  {
    title: 'Food Stall Counter Setup',
    group: 'food-stall' as const,
    groupLabel: 'Food Stall',
    image: '/landing/food-stall-works/cover.png',
  },
  {
    title: 'Stainless Kitchen Counter',
    group: 'kitchen' as const,
    groupLabel: 'Kitchen',
    image: '/landing/commercial-kitchens/cover.png',
  },
  {
    title: 'Kitchen Cabinet System',
    group: 'kitchen' as const,
    groupLabel: 'Kitchen',
    image: '/landing/hotel-kitchens/cover.png',
  },
  {
    title: 'Gasline Installation',
    group: 'gasline' as const,
    groupLabel: 'Gasline',
    image: '/landing/gasline-fire-suppression/project-1.png',
  },
  {
    title: 'Custom Stainless Works',
    group: 'custom' as const,
    groupLabel: 'Custom',
    image: '/landing/custom-metalworks/project-1.png',
  },
];

const MATERIALS = [
  {
    name: '304 Stainless Steel',
    detail: 'Food-grade and durable',
    texture: 'bg-[linear-gradient(135deg,#f8fafc_0%,#8d969f_36%,#f7f7f2_52%,#5d6871_100%)]',
  },
  {
    name: '316 Stainless Steel',
    detail: 'Corrosion resistant',
    texture: 'bg-[linear-gradient(135deg,#dce4eb_0%,#7b858f_35%,#f4f7f9_55%,#47515b_100%)]',
  },
  {
    name: 'Mirror Finish',
    detail: 'Reflective polish',
    texture: 'bg-[linear-gradient(135deg,#17212b_0%,#d9e3ea_45%,#ffffff_52%,#526170_100%)]',
  },
  {
    name: 'Brushed Finish',
    detail: 'Satin line texture',
    texture: 'bg-[repeating-linear-gradient(90deg,#bcc4cb_0px,#eef2f4_2px,#7f8992_5px,#d7dde2_8px)]',
  },
];

const SERVICE_BENEFITS = [
  {
    title: 'Premium Materials',
    description: 'High-quality stainless steel built to last.',
    Icon: ShieldCheck,
  },
  {
    title: 'Precision Fabrication',
    description: 'Expert craftsmanship with attention to detail.',
    Icon: Drill,
  },
  {
    title: 'Custom Solutions',
    description: 'Tailored designs to fit your needs and space.',
    Icon: BadgeCheck,
  },
  {
    title: 'Reliable Service',
    description: 'On-time delivery and professional support.',
    Icon: Handshake,
  },
];

const OFFICE_LOCATION = {
  label: 'RMV Stainless Steel Fabrication',
  address: 'BIR Village, Novaliches, Quezon City, Metro Manila 1118',
  plusCode: 'M3X3+RF4, Dahlia Ext, Quezon City, Metro Manila',
  lat: 14.6995125,
  lng: 121.053703125,
  tel: '02-9506187',
  mobile: '0945 285 2974',
  email: 'rmvstainless@gmail.com',
  hours: 'Mon - Sat: 8:00 AM - 6:00 PM',
  directionsUrl: 'https://www.google.com/maps?q=14.6995125,121.053703125',
};

export function LandingPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const bookingTarget = user ? '/appointments/book' : '/login';
  const [activeGallery, setActiveGallery] = useState<GalleryGroup>('all');
  const [selectedService, setSelectedService] = useState<LandingService | null>(null);

  const galleryItems = useMemo(() => {
    if (activeGallery === 'all') return COMPLETED_WORKS;
    return COMPLETED_WORKS.filter((item) => item.group === activeGallery);
  }, [activeGallery]);

  const goToBooking = () => navigate(bookingTarget);
  const selectedServiceDetail = selectedService ? SERVICE_DETAIL_METADATA[selectedService.type] : undefined;
  const bookService = (service: LandingService) => {
    if (user) {
      navigate('/appointments/book?serviceType=' + encodeURIComponent(service.type));
      return;
    }

    navigate('/login');
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#030405] text-white selection:bg-[#FFD700]/30 selection:text-white">
      <PublicNavbar />

      <main>
        <section id="hero" className="relative min-h-[620px] overflow-hidden border-b border-white/10 bg-black pt-16 lg:min-h-[720px]">
          <img
            src="/landing/hero/hero-stainless-railing-bg.png"
            alt="RMV stainless steel railing fabrication"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-90 lg:object-right"
          />
          <div className="absolute inset-0 bg-black/34" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#030405_0%,rgba(3,4,5,0.98)_25%,rgba(3,4,5,0.76)_43%,rgba(3,4,5,0.24)_72%,rgba(3,4,5,0.08)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#030405] via-[#030405]/72 to-transparent" />

          <div className="relative mx-auto flex min-h-[calc(620px-4rem)] max-w-7xl flex-col justify-center px-5 py-10 sm:px-8 lg:min-h-[656px] lg:px-12">
            <div className="max-w-[58rem]">
              <p className="label-font text-[11px] font-bold uppercase tracking-[0.32em] text-[#FFD700]">
                PRECISION STAINLESS STEEL FABRICATION
              </p>
              <div className="mt-3 h-0.5 w-11 bg-[#FFD700]" />

              <h1 className="mt-4 max-w-[54rem] font-['Sora','Space_Grotesk',system-ui,sans-serif] text-[2.65rem] font-extrabold leading-[1.06] tracking-[-0.04em] text-white sm:text-5xl lg:text-[76px]">
                <span className="block">Stainless and</span>
                <span className="block">custom metal works</span>
                <span className="block text-[#FFD700]">built to fit.</span>
              </h1>

              <p className="mt-5 max-w-2xl font-['Inter',system-ui,sans-serif] text-base leading-8 text-white/72 sm:text-lg">
                Railings, gates, counters, cabinets, canopies, signage, and custom stainless projects for homes and businesses.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={goToBooking}
                  style={{ backgroundColor: '#FFD700', backgroundImage: 'none' }}
                  className="label-font inline-flex h-[52px] cursor-pointer items-center justify-center gap-2 rounded-md border border-[#FFD700] px-8 text-[11px] font-black uppercase tracking-[0.2em] text-black shadow-[0_16px_42px_rgba(255,215,0,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ffe766] hover:brightness-110 hover:shadow-[0_20px_58px_rgba(255,215,0,0.42)] active:translate-y-0 active:scale-[0.98] sm:min-w-52"
                >
                  REQUEST QUOTE
                  <ArrowRight className="ml-5 h-5 w-5" />
                </button>
                <a
                  href="#projects"
                  style={{ backgroundImage: 'none' }}
                  className="label-font inline-flex h-[52px] cursor-pointer items-center justify-center gap-2 rounded-md border border-white/45 bg-black/35 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-[0_14px_36px_rgba(0,0,0,0.24)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FFD700]/75 hover:bg-white/10 hover:text-[#FFD700] hover:shadow-[0_18px_48px_rgba(0,0,0,0.36)] active:translate-y-0 active:scale-[0.98] sm:min-w-52"
                >
                  VIEW PROJECTS
                  <ArrowRight className="ml-5 h-5 w-5" />
                </a>
              </div>

              <div className="mt-7 flex max-w-4xl flex-wrap gap-3">
                {HERO_CHIPS.map((service) => {
                  const Icon = service.Icon;
                  return (
                    <div
                      key={service.type}
                      className="inline-flex min-h-11 items-center gap-2.5 rounded-md border border-white/18 bg-black/35 px-4 py-2 text-left text-[9px] font-black uppercase leading-tight tracking-[0.08em] text-white/90 shadow-[0_14px_40px_rgba(0,0,0,0.28)] backdrop-blur-md"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-[#FFD700]" />
                      <span>{service.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section
          id="services"
          className="relative overflow-hidden border-b border-white/10 bg-[#050708] py-8 sm:py-10"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/[0.025] to-transparent" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-6 max-w-3xl text-center">
              <div className="flex items-center justify-center gap-4">
                <span className="h-px w-8 bg-[#FFD700]/70 sm:w-12" />
                <p className="label-font text-[11px] font-black uppercase tracking-[0.32em] text-[#FFD700]">
                  What We Fabricate
                </p>
                <span className="h-px w-8 bg-[#FFD700]/70 sm:w-12" />
              </div>

              <h2 className="headline-font mt-3 text-2xl font-black uppercase tracking-[0.16em] text-white sm:text-3xl lg:text-4xl">
                RMV Services
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/68">
                Precision craftsmanship. Premium stainless steel. Built to last.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {FEATURED_SERVICES.map((service) => {
                const Icon = service.Icon;

                return (
                  <button
                    key={service.type}
                    type="button"
                    onClick={() => setSelectedService(service)}
                    className="group relative overflow-hidden rounded-xl border border-white/12 bg-[#0b1014] text-left shadow-[0_8px_22px_rgba(0,0,0,0.24)] transition duration-200 hover:-translate-y-0.5 hover:border-[#FFD700]/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050708]"
                    aria-label={`View details for ${service.label}`}
                  >
                    <div className="relative h-32 overflow-hidden bg-white/5 sm:h-36 xl:h-32">
                      <img
                        src={service.imageUrl}
                        alt={service.label}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#0b1014] to-transparent" />
                    </div>

                    <div className="relative min-h-[128px] px-3 pb-4 pt-9 text-center">
                      <div className="absolute left-1/2 top-0 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#FFD700]/65 bg-[#0a0e11] text-[#FFD700] shadow-[0_6px_18px_rgba(0,0,0,0.32)]">
                        <Icon className="h-5 w-5" strokeWidth={1.8} />
                      </div>

                      <h3 className="text-sm font-black leading-tight text-white">
                        {service.label}
                      </h3>

                      <div className="mx-auto mt-2 h-px w-8 bg-[#FFD700]" />

                      <p className="mx-auto mt-2 line-clamp-3 max-w-[12rem] text-[11px] leading-5 text-white/64">
                        {service.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-white/12 bg-[#070b0e]/90 shadow-[0_8px_24px_rgba(0,0,0,0.22)]">
              <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
                {SERVICE_BENEFITS.map((benefit, index) => {
                  const Icon = benefit.Icon;

                  return (
                    <div
                      key={benefit.title}
                      className={cn(
                        'flex items-center gap-3 p-3 sm:p-4',
                        index > 0 && 'lg:border-l lg:border-white/10',
                        index > 1 && 'sm:border-t sm:border-white/10 lg:border-t-0',
                      )}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#FFD700]">
                        <Icon className="h-5 w-5" strokeWidth={1.7} />
                      </div>

                      <div>
                        <h3 className="text-xs font-black text-white">
                          {benefit.title}
                        </h3>
                        <p className="mt-0.5 text-xs leading-5 text-white/58">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="projects" className="border-b border-white/10 bg-[#030405] py-10 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 text-center">
              <p className="label-font text-[11px] font-black uppercase tracking-[0.3em] text-[#FFD700]">Completed Works</p>
              <h2 className="headline-font mt-2 text-2xl font-black uppercase tracking-[0.14em] text-white sm:text-3xl">
                Project Gallery
              </h2>
            </div>

            <div className="mb-6 flex flex-wrap justify-center gap-3">
              {GALLERY_FILTERS.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActiveGallery(filter.key)}
                  className={cn(
                    'rounded-md border px-5 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition',
                    activeGallery === filter.key
                      ? 'border-[#FFD700] bg-[#FFD700] text-black'
                      : 'border-white/15 bg-white/[0.03] text-white/70 hover:border-[#FFD700]/50 hover:text-[#FFD700]',
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {galleryItems.map((item) => (
                <article key={item.title} className="overflow-hidden rounded-lg border border-white/12 bg-[#0b0e10]">
                  <img src={item.image} alt={item.title} className="h-44 w-full object-cover" loading="lazy" />
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-white">{item.title}</h3>
                    <p className="mt-1 text-xs text-white/55">{item.groupLabel}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={goToBooking}
                style={{ backgroundColor: '#FFD700', backgroundImage: 'none' }}
                className="label-font inline-flex h-[52px] cursor-pointer items-center justify-center gap-2 rounded-md border border-[#FFD700] px-8 text-[11px] font-black uppercase tracking-[0.2em] text-black shadow-[0_16px_42px_rgba(255,215,0,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ffe766] hover:brightness-110 hover:shadow-[0_20px_58px_rgba(255,215,0,0.42)] active:translate-y-0 active:scale-[0.98]"
              >
                Request a Similar Project
                <ArrowRight className="ml-3 h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section id="materials" className="border-b border-white/10 bg-[#050607] py-10 sm:py-12">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div>
              <p className="label-font text-[11px] font-black uppercase tracking-[0.3em] text-[#FFD700]">Materials & Finishes</p>
              <h2 className="headline-font mt-2 text-2xl font-black uppercase tracking-[0.14em] text-white sm:text-3xl">
                Stainless Options
              </h2>
              <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {MATERIALS.map((material) => (
                  <article key={material.name} className="overflow-hidden rounded-lg border border-white/12 bg-[#0b0e10]">
                    <div className={cn('h-28', material.texture)} />
                    <div className="p-4">
                      <h3 className="text-sm font-bold text-white">{material.name}</h3>
                      <p className="mt-1 text-xs text-white/55">{material.detail}</p>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-[#080b0d] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
                <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="min-h-[320px] border-b border-white/10 bg-black/30 p-3 lg:border-b-0 lg:border-r">
                    <LocationView
                      lat={OFFICE_LOCATION.lat}
                      lng={OFFICE_LOCATION.lng}
                      heightClass="h-[320px] sm:h-[380px]"
                    />
                  </div>

                  <div className="flex flex-col justify-center p-6 sm:p-8">
                    <p className="label-font text-[10px] font-black uppercase tracking-[0.28em] text-[#FFD700]">
                      Visit Our Office
                    </p>
                    <h3 className="headline-font mt-3 text-2xl font-black uppercase tracking-[0.1em] text-white sm:text-3xl">
                      {OFFICE_LOCATION.label}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-white/60">
                      Find RMV Fabrication or book a site visit for your project.
                    </p>

                    <div className="mt-6 grid gap-3">
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex gap-3">
                          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#FFD700]" />
                          <div>
                            <p className="label-font text-[10px] font-black uppercase tracking-[0.2em] text-white/42">
                              Address
                            </p>
                            <p className="mt-2 text-sm font-semibold leading-6 text-white">{OFFICE_LOCATION.address}</p>
                            <p className="mt-1 text-xs leading-5 text-white/50">{OFFICE_LOCATION.plusCode}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                          <Phone className="h-5 w-5 text-[#FFD700]" />
                          <p className="label-font mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/42">
                            Contact
                          </p>
                          <p className="mt-2 text-sm font-semibold text-white">{OFFICE_LOCATION.tel}</p>
                          <p className="mt-1 text-sm text-white/60">{OFFICE_LOCATION.mobile}</p>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                          <Clock className="h-5 w-5 text-[#FFD700]" />
                          <p className="label-font mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/42">
                            Office Hours
                          </p>
                          <p className="mt-2 text-sm font-semibold leading-6 text-white">{OFFICE_LOCATION.hours}</p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex gap-3">
                          <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[#FFD700]" />
                          <div>
                            <p className="label-font text-[10px] font-black uppercase tracking-[0.2em] text-white/42">
                              Email
                            </p>
                            <p className="mt-2 break-words text-sm font-semibold text-white">{OFFICE_LOCATION.email}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <a
                        href={OFFICE_LOCATION.directionsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="label-font inline-flex h-[48px] cursor-pointer items-center justify-center gap-3 rounded-md border border-white/15 bg-white/[0.04] px-5 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FFD700]/60 hover:text-[#FFD700] active:translate-y-0"
                      >
                        Get Directions
                        <Navigation className="h-4 w-4" />
                      </a>
                      <button
                        type="button"
                        onClick={goToBooking}
                        style={{ backgroundColor: '#FFD700', backgroundImage: 'none' }}
                        className="label-font inline-flex h-[48px] cursor-pointer items-center justify-center gap-3 rounded-md border border-[#FFD700] px-5 text-[10px] font-black uppercase tracking-[0.2em] text-black shadow-[0_14px_34px_rgba(255,215,0,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_18px_46px_rgba(255,215,0,0.36)] active:translate-y-0 active:scale-[0.98]"
                      >
                        Request Quote
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer id="contact" className="bg-[#050607]">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
            <div>
              <p className="headline-font text-xl font-black uppercase tracking-tight text-[#FFD700]">RMV Fabrication</p>
              <p className="label-font mt-1 text-[9px] font-black uppercase tracking-[0.32em] text-white/70">
                Stainless Steel Fabrication
              </p>
              <p className="mt-4 max-w-xs text-sm leading-6 text-white/58">
                Precision stainless and custom metal works for residential, commercial, and industrial projects.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.22em] text-white">Quick Links</h3>
              <div className="mt-4 grid gap-2 text-sm text-white/58">
                <a href="#services" className="hover:text-[#FFD700]">Services</a>
                <a href="#projects" className="hover:text-[#FFD700]">Projects</a>
                <a href="#materials" className="hover:text-[#FFD700]">Materials</a>
                <a href="#contact" className="hover:text-[#FFD700]">Contact</a>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.22em] text-white">Services</h3>
              <div className="mt-4 grid gap-2 text-sm text-white/58">
                {REAL_SERVICES.slice(0, 6).map((service) => (
                  <button
                    key={service.type}
                    type="button"
                    onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-left hover:text-[#FFD700]"
                  >
                    {service.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.22em] text-white">Contact Us</h3>
              <div className="mt-4 grid gap-3 text-sm text-white/58">
                <p>0917 123 4567</p>
                <p>info@rmvfabrication.app</p>
                <p>Quezon City, Metro Manila</p>
                <p>Mon - Sat: 8:00 AM - 6:00 PM</p>
              </div>
              <Button
                type="button"
                onClick={goToBooking}
                className="brass-gradient mt-5 h-10 rounded-md border-none px-5 text-[10px] font-black uppercase tracking-[0.2em] text-black"
              >
                Request Quote
              </Button>
            </div>
          </div>

          <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/40">
            © 2026 RMV Fabrication. All rights reserved.
          </div>
        </footer>
      </main>

      <Dialog
        open={Boolean(selectedService)}
        onOpenChange={(open) => {
          if (!open) setSelectedService(null);
        }}
      >
        <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] max-w-6xl gap-0 overflow-hidden rounded-2xl border border-white/10 bg-[#07090b] p-0 text-white shadow-[0_30px_120px_rgba(0,0,0,0.72)] sm:w-[calc(100vw-2rem)] sm:rounded-2xl">
          {selectedService && selectedServiceDetail && (
            <div className="flex max-h-[92vh] flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
                  <div className="relative min-h-[260px] overflow-hidden bg-white/5 sm:min-h-[340px] lg:min-h-[440px]">
                    <img
                      src={selectedService.imageUrl}
                      alt={selectedService.label}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07090b] via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-[#07090b]/70" />
                  </div>

                  <div className="flex flex-col justify-between gap-5 p-5 sm:p-7 lg:p-8">
                    <DialogHeader className="space-y-4 text-left">
                      <p className="label-font text-[10px] font-black uppercase tracking-[0.28em] text-[#FFD700]">
                        Service Detail
                      </p>
                      <DialogTitle className="headline-font text-2xl font-black uppercase tracking-[0.08em] text-white sm:text-4xl">
                        {selectedService.label}
                      </DialogTitle>
                      <DialogDescription className="max-w-none text-sm leading-7 text-white/68 sm:text-base">
                        {selectedServiceDetail.fullDescription}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="rounded-2xl border border-[#FFD700]/25 bg-[linear-gradient(135deg,rgba(255,215,0,0.12),rgba(255,215,0,0.035))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_55px_rgba(0,0,0,0.24)]">
                      <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#FFD700]">Estimated Price Range</h3>
                      <p className="mt-3 text-2xl font-black leading-tight text-white sm:text-3xl">
                        {selectedServiceDetail.estimatedPrice}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-white/68">{selectedServiceDetail.priceNote}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5 border-t border-white/10 p-5 sm:p-7 lg:p-8">
                  <div>
                    <p className="label-font text-[10px] font-black uppercase tracking-[0.28em] text-[#FFD700]">
                      Project Specification Guide
                    </p>
                    <h3 className="headline-font mt-2 text-xl font-black uppercase tracking-[0.1em] text-white sm:text-2xl">
                      What Sales Staff Will Confirm
                    </h3>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    {selectedServiceDetail.specGroups.map((group) => (
                      <section
                        key={group.title}
                        className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                      >
                        <div className="mb-4 flex items-center gap-3">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#FFD700]" />
                          <h4 className="text-xs font-black uppercase tracking-[0.18em] text-white">{group.title}</h4>
                        </div>

                        <div className="grid gap-3">
                          {group.items.map((item) => (
                            <div key={item.label} className="rounded-xl border border-white/10 bg-black/25 p-3">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <p className="text-sm font-bold text-white">{item.label}</p>
                                {item.required && (
                                  <span className="rounded-full border border-[#FFD700]/30 bg-[#FFD700]/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#FFD700]">
                                    Required
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-sm font-semibold leading-6 text-[#FFD700]/90">{item.value}</p>
                              {item.note && <p className="mt-1 text-xs leading-5 text-white/58">{item.note}</p>}
                            </div>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                    <p className="text-sm leading-6 text-white/70">{SERVICE_QUOTE_DISCLAIMER}</p>
                  </div>
                </div>
              </div>

              <DialogFooter className="shrink-0 gap-3 border-t border-white/10 bg-[#07090b]/95 p-5 sm:flex-row sm:justify-end sm:space-x-0">
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-md border-white/20 bg-transparent px-6 text-[11px] font-black uppercase tracking-[0.16em] text-white hover:border-white/45 hover:bg-white/10 hover:text-white"
                  >
                    Close
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  onClick={() => bookService(selectedService)}
                  className="brass-gradient h-11 rounded-md border-none px-6 text-[11px] font-black uppercase tracking-[0.16em] text-black shadow-[0_14px_38px_rgba(255,215,0,0.24)] hover:brightness-110"
                >
                  Book This Service
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
