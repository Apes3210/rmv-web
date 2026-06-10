import type { ComponentType } from 'react';
import {
  Layers,
  Store,
  Maximize,
} from 'lucide-react';
import { ServiceType } from './constants';

export interface ServiceCollection {
  id: string;
  label: string;
  headline: string;
  shortDescription: string;
  capabilityDescription: string;
  bestFor: string;
  scopeNote: string;
  coverImage: string;
  tags: string[];
  systems: string[];
  icon: ComponentType<{ className?: string }>; 
  projects: Array<{
    title: string;
    location: string;
    image: string;
    description: string;
  }>;
  serviceType?: ServiceType;
}

export const SERVICE_CATALOG: ServiceCollection[] = [
  {
    id: 'completed-works',
    label: 'Completed Works',
    headline: 'Commercial Kitchens & HVAC Systems',
    shortDescription: 'Professional stainless steel fabrication for kitchens, ductwork, and overhead ventilation systems.',
    capabilityDescription: 'Complete commercial kitchen installations featuring custom fabrication, professional-grade ductwork, and full HVAC integration for restaurants and commercial food operations.',
    bestFor: 'Restaurants, commercial kitchens, and hospitality establishments.',
    scopeNote: 'From design through installation, including stainless counters, exhaust systems, and integrated ventilation.',
    coverImage: '/landing/completed-works/cover.png',
    tags: ['Commercial Grade', 'Ventilation Ready', 'Installation Included'],
    systems: ['Stainless counters', 'Ductwork fabrication', 'Exhaust hoods', 'Ventilation integration'],
    icon: Layers,
    serviceType: ServiceType.KITCHEN_COUNTER,
    projects: [
      {
        title: 'Professional Exhaust & Ducting',
        location: 'Commercial Kitchen',
        image: '/landing/completed-works/cover.png',
        description: 'Comprehensive overhead ventilation and ductwork installation, featuring custom-fabricated stainless steel hoods and professional-grade air extraction systems.',
      },
      {
        title: 'Commercial Kitchen Workstations',
        location: 'Metro Manila',
        image: '/landing/completed-works/project-1.jpg',
        description: 'Complete commercial kitchen layout featuring heavy-duty stainless steel shelving, custom workstations, and integrated stove units for high-efficiency food production.',
      },
      {
        title: 'Ceiling & Ventilation Infrastructure',
        location: 'Quezon City',
        image: '/landing/completed-works/project-2.png',
        description: 'Advanced kitchen ventilation setup featuring professional-grade exhaust hoods, ceiling-integrated ductwork, and specialized air filtration systems.',
      },
      {
        title: 'Stainless Steel Kitchen Build',
        location: 'Laguna',
        image: '/landing/completed-works/project-3.png',
        description: 'Full-scale stainless steel fabrication for industrial kitchens, including custom preparation tables, wall shelving, and integrated safety equipment.',
      },
    ],
  },
  {
    id: 'food-stall-works',
    label: 'Food Stall Works',
    headline: 'Food Stalls & Retail Food Service',
    shortDescription: 'Compact, efficient stainless steel food service counters and stall systems for food courts and retail operations.',
    capabilityDescription: 'Purpose-built food stall and kiosk solutions featuring branded signage, display cases, serving counters, and storage integration for maximum functionality in minimal space.',
    bestFor: 'Food courts, shopping malls, street vendors, and small food service operations.',
    scopeNote: 'Complete stall setup including counter fabrication, branding, and customer-facing design.',
    coverImage: '/landing/food-stall-works/cover.png',
    tags: ['Retail Ready', 'Branded Design', 'Compact Layout'],
    systems: ['Service counters', 'Display cases', 'Stainless fabrication', 'Custom signage'],
    icon: Store,
    serviceType: ServiceType.SIGNAGE,
    projects: [
      {
        title: 'Hungry Bik Food Stall',
        location: 'Food Court',
        image: '/landing/food-stall-works/cover.png',
        description: 'Complete branded food stall featuring vibrant signage, professional serving counter with integrated storage, and custom stainless steel food preparation areas.',
      },
      {
        title: 'Mango on the Go Kiosk',
        location: 'Shopping Mall',
        image: '/landing/food-stall-works/project-1.png',
        description: 'Vibrant branded kiosk featuring custom serving counters, integrated display areas, and stainless steel preparation surfaces for specialty beverage service.',
      },
      {
        title: 'Pamiyan\'s Burmese Food Stall',
        location: 'Food Center',
        image: '/landing/food-stall-works/project-2.png',
        description: 'Professional retail food stall featuring high-contrast branding, custom-fabricated stainless service counters, and integrated overhead lighting for maximum visibility.',
      },
      {
        title: 'Ranile\'s Best Bulaluhan',
        location: 'Retail Location',
        image: '/landing/food-stall-works/project-3.png',
        description: 'Full-service food stall setup featuring an expansive menu board system, custom stainless workstations, and integrated storage for high-volume retail environments.',
      },
    ],
  },
  {
    id: 'gasline-fire-suppression',
    label: 'Gasline & Fire Suppression',
    headline: 'Gasline, Fire Suppression & Industrial Installation',
    shortDescription: 'Expert fabrication and installation of gas systems, fire suppression equipment, and specialized industrial piping.',
    capabilityDescription: 'Complete utility infrastructure solutions including certified gasline installations, fire suppression system setup, and industrial piping fabrication for commercial and industrial facilities.',
    bestFor: 'Commercial buildings, restaurants, kitchens, and industrial facilities requiring safety systems.',
    scopeNote: 'Certified installations meeting all safety codes and regulations for gas and fire suppression systems.',
    coverImage: '/landing/gasline-fire-suppression/cover.png',
    tags: ['Safety Certified', 'Industrial Grade', 'Code Compliant'],
    systems: ['Gasline installation', 'Fire suppression setup', 'Pressure piping', 'Safety systems'],
    icon: Maximize,
    serviceType: ServiceType.CUSTOM,
    projects: [
      {
        title: 'Internal Gasline Distribution',
        location: 'Commercial Kitchen',
        image: '/landing/gasline-fire-suppression/cover.png',
        description: 'Precision-engineered internal gas distribution system featuring low-profile piping, professional surface mounting, and integrated safety shut-off controls.',
      },
      {
        title: 'Exterior Gasline Installation',
        location: 'Industrial Site',
        image: '/landing/gasline-fire-suppression/project-1.png',
        description: 'Professional-grade exterior gasline fabrication using heavy-duty piping and certified mounting systems, ensuring full compliance with safety standards.',
      },
      {
        title: 'Industrial Pressure Testing',
        location: 'Testing Phase',
        image: '/landing/gasline-fire-suppression/project-2.png',
        description: 'Rigorous pressure testing and calibration for gas and liquid distribution systems, using certified gauges to ensure system integrity and safety.',
      },
      {
        title: 'Automated Fire Suppression',
        location: 'Operational Area',
        image: '/landing/gasline-fire-suppression/project-3.png',
        description: 'Specialized fire suppression system featuring high-capacity pressure vessels, professional mounting, and integrated piping for high-risk commercial environments.',
      },
    ],
  },
];

export function getServiceById(id: string | undefined) {
  return SERVICE_CATALOG.find((item) => item.id === id);
}

export function getServiceLabelByType(serviceType: ServiceType | string | undefined): string {
  return SERVICE_CATALOG.find((item) => item.serviceType === serviceType)?.label ?? String(serviceType || 'Service');
}
