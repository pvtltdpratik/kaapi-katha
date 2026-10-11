import type { BuilderConfig } from "@/lib/builderConfig";

export interface MenuItem {
  id: number;
  name: string;
  subtitle: string;
  description: string;
  price: string;
  image: string;
  video?: string;
  /** present on cups built in the customizer, so the exact recipe travels with the cart line */
  config?: BuilderConfig;
}

export const menuData: MenuItem[] = [
  {
    id: 1,
    name: "Madras Filter Kaapi",
    subtitle: "The Davara Classic",
    description:
      "Strong decoction, hot milk, pulled until it foams.",
    price: "₹140",
    image: "/images/coffee/menu_custom_5.jpg",
  },
  {
    id: 2,
    name: "Classic Cold Coffee",
    subtitle: "Thick & Frosty",
    description:
      "Blended with milk and ice, finished with cream.",
    price: "₹180",
    image: "/images/coffee/menu_custom_1.jpg",
  },
  {
    id: 3,
    name: "Elaichi Latte",
    subtitle: "Warm Spice",
    description:
      "Espresso and steamed milk with crushed cardamom.",
    price: "₹190",
    image: "/images/coffee/menu_custom_3.jpg",
  },
  {
    id: 4,
    name: "Monsoon Cold Brew",
    subtitle: "Steeped Slow",
    description:
      "Steeped overnight, poured over ice.",
    price: "₹210",
    image: "/images/coffee/menu_custom_4.jpg",
  },
  {
    id: 5,
    name: "Jaggery Latte",
    subtitle: "Gur Sweet",
    description:
      "Sweetened with dark jaggery instead of sugar.",
    price: "₹170",
    image: "/images/coffee/menu_psl.jpg",
  },
];
