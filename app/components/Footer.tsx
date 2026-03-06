'use client';

import Link from "next/link";
import Image from "next/image";
import {
  siTelegram,
  siYoutube,
  siVk,
  siSpotify,
  siSoundcloud,
  siApplemusic,
  siInstagram,
} from "simple-icons";
import { useLanguage } from "../contexts/LanguageContext";

interface LinkItem {
  name: string;
  href: string;
  iconPath?: string;
  iconType: "svg" | "image";
  iconSrc?: string;
}

const socialLinks: LinkItem[] = [
  { name: "Telegram", href: "https://t.me/yamme_tee", iconPath: siTelegram.path, iconType: "svg" },
  { name: "YouTube", href: "https://www.youtube.com/@yammetee", iconPath: siYoutube.path, iconType: "svg" },
  { name: "VK", href: "https://vk.com/yammetee", iconPath: siVk.path, iconType: "svg" },
  {
    name: "Spotify",
    href: "https://open.spotify.com/artist/4M2mnlLmJw78weAqwXagO6?si=XVpUB33kQwON_bKX2jreRw",
    iconPath: siSpotify.path,
    iconType: "svg",
  },
  {
    name: "Yandex Music",
    href: "https://music.yandex.com/artist/23759392?utm_source=web&utm_medium=copy_link",
    iconSrc: "https://music.yandex.com/favicon.ico",
    iconType: "image",
  },
  {
    name: "Zvuk",
    href: "https://zvuk.com/artist/213226620",
    iconSrc: "https://zvuk.com/favicon.ico",
    iconType: "image",
  },
  { name: "SoundCloud", href: "https://soundcloud.com/yamme-tee", iconPath: siSoundcloud.path, iconType: "svg" },
  {
    name: "Apple Music",
    href: "https://music.apple.com/us/artist/yamme-tee/1792184745",
    iconPath: siApplemusic.path,
    iconType: "svg",
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/yamme_tee/",
    iconPath: siInstagram.path,
    iconType: "svg",
  },
];

function BrandIcon({ item }: { item: LinkItem }) {
  if (item.iconType === "svg" && item.iconPath) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
        className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-gray-200 group-hover:text-white transition-colors"
      >
        <path d={item.iconPath} />
      </svg>
    );
  }

  return (
    <Image
      src={item.iconSrc}
      alt=""
      width={16}
      height={16}
      unoptimized
      aria-hidden
      className="w-4 h-4 sm:w-[18px] sm:h-[18px] grayscale invert opacity-85 group-hover:opacity-100 transition-opacity"
    />
  );
}

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-neutral-800 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-[10px]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="order-1 sm:order-2 flex w-full sm:w-auto flex-nowrap justify-between sm:justify-end gap-1 sm:gap-2">
            {socialLinks.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center p-1.5 sm:p-2 rounded-sm bg-neutral-950/40 hover:bg-neutral-900/70 transition-colors"
                aria-label={item.name}
              >
                <BrandIcon item={item} />
              </Link>
            ))}
          </div>
          <p className="order-2 sm:order-1 text-xs text-gray-500 text-center sm:text-left">{t.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
