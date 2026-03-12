import { faXTwitter, faYoutube } from "@fortawesome/free-brands-svg-icons";
import { faGear, faGlobe, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ReactNode } from "react";

import { Button } from "@ui/Button";
import {
  getEnabledPresetLabels,
  usesSectionHidingOnly,
} from "../../shared/presets";
import { isSiteRuleBlockingNow } from "../../shared/schedule";
import type { SiteRule } from "../../shared/types";

type SiteCardProps = {
  rule: SiteRule;
  onEdit: () => void;
  onRemove: () => void;
};

function getSiteIcon(domain: string) {
  if (domain === "youtube.com") {
    return faYoutube;
  }

  if (domain === "x.com" || domain === "twitter.com") {
    return faXTwitter;
  }

  return faGlobe;
}

function Badge({ children, active = false }: { children: ReactNode; active?: boolean }) {
  return (
    <span
      className={`border px-2 py-1 text-xs font-semibold ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-foreground/20 bg-background text-foreground"
      }`}
    >
      {children}
    </span>
  );
}

export function SiteCard({ rule, onEdit, onRemove }: SiteCardProps) {
  const enabledPresetLabels = getEnabledPresetLabels(rule);
  const selectorCount = rule.customSelectors.length;
  const blockingNow = isSiteRuleBlockingNow(rule);
  const sectionOnlyRule = usesSectionHidingOnly(rule.domain);

  return (
    <article className="border border-foreground/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <span className="inline-flex shrink-0 h-9 w-9!  items-center justify-center border border-foreground/20">
              <FontAwesomeIcon icon={getSiteIcon(rule.domain)} />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold">{rule.domain}</h2>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {sectionOnlyRule && !rule.enabled
                  ? "Sections hidden"
                  : rule.blockingMode === "always"
                    ? "Always blocked"
                    : rule.schedules.length === 0
                    ? "Scheduled • No schedules"
                    : rule.schedules.length === 1
                      ? `Scheduled • ${rule.schedules[0].name}`
                      : `Scheduled • ${rule.schedules.length} schedules`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="icon"
            aria-label={`Edit ${rule.domain}`}
            onClick={onEdit}
          >
            <FontAwesomeIcon icon={faGear} />
          </Button>
          <Button
            size="icon"
            aria-label={`Remove ${rule.domain}`}
            onClick={onRemove}
          >
            <FontAwesomeIcon icon={faXmark} />
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge active={blockingNow}>
          {blockingNow ? "Blocking now" : "Not blocking now"}
        </Badge>

        {enabledPresetLabels.map((label) => (
          <Badge key={label}>{label}</Badge>
        ))}

        {selectorCount > 0 ? (
          <Badge>
            {selectorCount} selector{selectorCount === 1 ? "" : "s"}
          </Badge>
        ) : null}
      </div>
    </article>
  );
}
