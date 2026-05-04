import type { Metadata } from "next";
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
} from "@/components/ui";

export const metadata: Metadata = {
  title: "404",
  description: "页面未找到",
};

export default function NotFound() {
  return (
    <Container>
      <div className="mb-6">
        <ActionLink href="/" variant="subtle">
          <Cmd>cd ..</Cmd>
        </ActionLink>
      </div>

      <header className="mb-6 sm:mb-8">
        <Title className="mb-1">
          <Prompt>404</Prompt>
          <Cursor />
        </Title>
        <MutedText className="pl-4 sm:pl-6 text-base sm:text-lg">
          你访问的页面不在这里，可能换了个目录躲起来了。
        </MutedText>
      </header>

      <StatusLine className="mb-4 sm:mb-6">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          NOT FOUND
        </span>
        <span className="hidden sm:inline">|</span>
        <span>exit code: 404</span>
        <span className="hidden sm:inline">|</span>
        <span>hint: cd ..</span>
      </StatusLine>

      <div className="mb-3">
        <Cmd>ls /</Cmd>
      </div>

      <div className="space-y-3">
        <TreeItem>
          <ActionLink href="/" variant="primary">
            home
          </ActionLink>
        </TreeItem>
        <TreeItem>
          <ActionLink href="/now" variant="primary">
            now
          </ActionLink>
        </TreeItem>
        <TreeItem isLast>
          <ActionLink href="/links" variant="primary">
            links
          </ActionLink>
        </TreeItem>
      </div>

      <Divider />

      <div className="mb-3">
        <Cmd>cat ./help.txt</Cmd>
      </div>
      <MutedText className="text-base">
        如果你确定这个页面应该存在，可能是链接过期了，回到首页再试试。
      </MutedText>

      <div className="mt-8">
        <Cursor text="Ready" />
      </div>
    </Container>
  );
}
