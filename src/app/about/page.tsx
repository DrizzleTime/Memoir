import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  Container,
  Prompt,
  Cmd,
  Cursor,
  Divider,
  Title,
  ActionLink,
  MutedText,
  StatusLine,
  TreeItem,
  Avatar,
} from "@/components/ui";
import { getSiteConfig } from "@/lib/site";
import { ensureInstalled } from "@/lib/install-guard";

export async function generateMetadata(): Promise<Metadata> {
  ensureInstalled();
  const siteConfig = await getSiteConfig();

  return {
    title: "About",
    description: `关于 ${siteConfig.name} 的介绍和联系方式。`,
    alternates: {
      canonical: "/about",
    },
  };
}

type InfoItem = {
  label: string;
  value: ReactNode;
};

function buildInfo(email: string): InfoItem[] {
  return [
    { label: "name", value: "时雨" },
    { label: "role", value: "在读研究生·江苏" },
    { label: "status", value: "实习·上海（字节跳动）" },
    { label: "city", value: "来自·临沂" },
    { label: "stack", value: "TS / Python / C#" },
    {
      label: "mail",
      value: (
        <ActionLink href={`mailto:${email}`} variant="primary">
          {email}
        </ActionLink>
      ),
    },
  ];
}

const PROGRAM_INFO: InfoItem[] = [
  { label: "program", value: "Memoir" },
  { label: "author", value: "时雨" },
];

function buildSocials(email: string) {
  return [
    {
      name: "github",
      href: "https://github.com/DrizzleTime",
      hint: "@DrizzleTime",
    },
    {
      name: "email",
      href: `mailto:${email}`,
      hint: email,
    },
  ];
}

const SIGNATURE = [
  "写代码，也写文字。",
  "保持好奇。",
].join("\n");

export default async function AboutPage() {
  ensureInstalled();
  const siteConfig = await getSiteConfig();
  const email = siteConfig.contactEmail;
  const info = buildInfo(email);
  const socials = buildSocials(email);

  return (
    <Container>
      <div className="mb-6">
        <ActionLink href="/" variant="subtle">
          <Cmd>cd ..</Cmd>
        </ActionLink>
      </div>

      <header className="mb-6 sm:mb-8">
        <Title className="mb-1">
          <Prompt>About</Prompt>
          <Cursor />
        </Title>
        <MutedText className="pl-4 sm:pl-6 text-base sm:text-lg">自我介绍</MutedText>
      </header>

      <StatusLine className="mb-4 sm:mb-6">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          ABOUT
        </span>
        <span className="hidden sm:inline">|</span>
        <span>来自临沂</span>
        <span className="hidden sm:inline">|</span>
        <span>研究生 · 实习</span>
      </StatusLine>

      <div className="mb-3">
        <Cmd>whoami</Cmd>
      </div>

      <div className="flex items-start gap-4">
        <Avatar email={email} name="时雨" size={56} />
        <div className="space-y-2 min-w-0">
          {info.map((item, index) => (
            <TreeItem key={item.label} isLast={index === info.length - 1}>
              <div className="flex flex-wrap gap-x-2">
                <span className="text-violet-600">{item.label}:</span>
                <span className="text-neutral-700 break-words">{item.value}</span>
              </div>
            </TreeItem>
          ))}
        </div>
      </div>

      <Divider />

      <div className="mb-3">
        <Cmd>cat ./program.txt</Cmd>
      </div>

      <div className="space-y-2">
        {PROGRAM_INFO.map((item, index) => (
          <TreeItem key={item.label} isLast={index === PROGRAM_INFO.length - 1}>
            <div className="flex flex-wrap gap-x-2">
              <span className="text-violet-600">{item.label}:</span>
              <span className="text-neutral-700 break-words">{item.value}</span>
            </div>
          </TreeItem>
        ))}
      </div>

      <Divider />

      <div className="mb-3">
        <Cmd>ls ./social</Cmd>
      </div>

      <div className="space-y-3">
        {socials.map((item, index) => (
          <TreeItem key={item.name} isLast={index === socials.length - 1}>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <ActionLink
                href={item.href}
                variant="primary"
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
              >
                {item.name}
              </ActionLink>
              <MutedText as="span" className="text-sm">
                {item.hint}
              </MutedText>
            </div>
          </TreeItem>
        ))}
      </div>

      <Divider />

      <div className="mb-3">
        <Cmd>cat ./signature.txt</Cmd>
      </div>
      <MutedText as="div" className="text-base whitespace-pre-wrap">
        {SIGNATURE}
      </MutedText>

      <div className="mt-8">
        <Cursor text="Ready" />
      </div>
    </Container>
  );
}
