import { PageHeader } from "@/components/PageHeader";
import { TagManager } from "@/components/TagManager";
import { listTagsWithCounts } from "@/lib/repos/tags";

export const dynamic = "force-dynamic";

export default function TagsPage() {
  const tags = listTagsWithCounts();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tags"
        description="Group problems by technique or topic. Deleting a tag never deletes its problems."
      />
      <TagManager tags={tags} />
    </div>
  );
}
