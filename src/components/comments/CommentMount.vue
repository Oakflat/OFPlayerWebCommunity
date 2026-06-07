<template>
  <!--
    评论区挂载占位
    第一阶段：不实现真实评论系统，不引入 UGC 风险。
    只展示反馈入口（外部链接/邮件）。
  -->
  <section class="comment-mount">
    <div class="comment-mount__inner">
      <p class="comment-mount__heading">{{ t('tools.comments.heading') }}</p>
      <p class="comment-mount__body">
        {{ t('tools.comments.body') }}
      </p>
      <div class="comment-mount__actions">
        <a
          href="https://github.com/ofplayer/ofplayer/issues"
          target="_blank"
          rel="noopener noreferrer"
          class="comment-mount__btn"
        >
          {{ t('tools.comments.githubIssue') }}
        </a>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from '../../composables/useI18n.js'

const { t } = useI18n()

defineProps({
  pageType: {
    type: String,
    default: 'tool',
  },
  pageSlug: {
    type: String,
    default: '',
  },
  /**
   * 'disabled'       - 第一阶段：不允许公开评论
   * 'pending_first'  - 新评论先审核再发布
   * 'open'           - 开放评论（未来）
   */
  moderationMode: {
    type: String,
    default: 'disabled',
  },
})
</script>

<style scoped>
.comment-mount {
  border-top: 1px solid var(--of-border);
  padding-top: var(--space-8);
}

.comment-mount__inner {
  padding: var(--space-6);
  background: var(--of-bg-soft);
  border-radius: 12px;
  border: 1px solid var(--of-border);
}

.comment-mount__heading {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--of-ink);
  margin: 0 0 var(--space-2);
}

.comment-mount__body {
  font-size: var(--font-size-sm);
  color: var(--of-ink-muted);
  margin: 0 0 var(--space-4);
  line-height: var(--line-height-relaxed);
}

.comment-mount__actions {
  display: flex;
  gap: var(--space-3);
}

.comment-mount__btn {
  display: inline-flex;
  align-items: center;
  padding: var(--space-2) var(--space-4);
  border-radius: 8px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--of-brand);
  border: 1px solid var(--of-brand-border);
  background: var(--of-brand-soft);
  text-decoration: none;
  transition:
    background var(--transition-fast),
    color var(--transition-fast);
}

.comment-mount__btn:hover {
  background: var(--of-brand);
  color: #fff;
}
</style>
