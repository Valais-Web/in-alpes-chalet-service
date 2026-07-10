/**
 * Real photos used in the site chrome (home, services, Open Graph).
 *
 * These replace the AI-generated demo images that shipped with the scaffold.
 * All are Bart's own Airbnb photos, re-hosted on Cloudinary (f_auto,q_auto),
 * plus one licensed 4 Vallées ski shot for the destination section.
 */
const CLOUD = "https://res.cloudinary.com/crxvfdmr/image/upload/f_auto,q_auto";

export const SITE_IMAGES = {
  /** Le Combin: outdoor hot tub with the Alps view. Home hero + OG. */
  heroChalet: `${CLOUD}/v1783681662/in-alpes/apartments/le-combin/ehrfrnojtjttuxsj1vzx.jpg`,
  /** Studio In-Alpes: bed under the panoramic arched window over the valley. */
  valleyView: `${CLOUD}/v1783681676/in-alpes/apartments/studio-in-alpes/c9zu0d0xlpnekugxnhqn.jpg`,
  /** 4 Vallées ski area (Plan-du-Fou). Home destination section. */
  skiFourValleys: `${CLOUD}/v1783683927/in-alpes/site/vx8bhtjmoccush7qvdej.jpg`,
  /** Le Combin: cosy living room with beams and leather sofa. Services hero. */
  cosyLiving: `${CLOUD}/v1783681662/in-alpes/apartments/le-combin/pva8kdd85vcdzygieuww.jpg`,
  /** Perce Neige 21: bright, tastefully furnished living room. Presentation. */
  brightLiving: `${CLOUD}/v1783681694/in-alpes/apartments/perce-neige-21/qizwst6umdlt8bbjj4k3.jpg`,
} as const;

/** Official Airbnb wordmark (coral). Shown beside the aggregate rating so the
 * reviews read as verified Airbnb reviews. The one deliberate red on the site. */
export const AIRBNB_LOGO = `${CLOUD}/v1783689153/in-alpes/brand/nbronulj0h24bowijj4k.webp`;
