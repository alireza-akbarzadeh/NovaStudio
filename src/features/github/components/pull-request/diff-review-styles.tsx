export function PullRequestDiffReviewStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        .pull-request-diff-review .pr-review-line-hover {
          background-color: rgba(56, 139, 253, 0.12);
        }
        .pull-request-diff-review .pr-review-line-draft {
          background-color: rgba(56, 139, 253, 0.18);
        }
        .pull-request-diff-review .pr-review-line-commented {
          background-color: rgba(56, 139, 253, 0.08);
        }
        .pull-request-diff-review .pr-review-line-active {
          background-color: rgba(56, 139, 253, 0.22);
        }
        .pull-request-diff-review .pr-review-glyph-commented {
          background: rgba(56, 139, 253, 0.85);
          border-radius: 9999px;
          width: 8px !important;
          height: 8px !important;
          margin-left: 5px;
          margin-top: 6px;
        }
        .pull-request-diff-review .pr-review-add-widget {
          margin-left: 8px;
          z-index: 10;
        }
        .pull-request-diff-review .pr-review-add-widget button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 6px;
          border: 1px solid rgba(56, 139, 253, 0.45);
          background: #1f6feb;
          color: white;
          font-size: 16px;
          line-height: 1;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
        }
        .pull-request-diff-review .pr-review-add-widget button:hover {
          background: #388bfd;
        }
      `,
      }}
    />
  );
}
