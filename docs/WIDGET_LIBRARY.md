# Widget Library

This document provides code snippets and examples for integrating Internet ID verification badges into your application using various frameworks and platforms.

## Table of Contents

1. [Vanilla JavaScript](#vanilla-javascript)
2. [React Component](#react-component)
3. [Vue Component](#vue-component)
4. [WordPress](#wordpress)
5. [GitHub README](#github-readme)
6. [Static HTML](#static-html)

---

## Vanilla JavaScript

### Simple Badge Widget

Add this script to your HTML to dynamically insert verification badges:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Page</title>
  </head>
  <body>
    <div id="badge-container"></div>

    <script>
      // Internet ID Badge Widget
      (function () {
        const InternetIDBadge = {
          create: function (options) {
            const {
              hash,
              theme = "dark",
              size = "medium",
              style = "rounded",
              showTimestamp = false,
              showPlatform = false,
              platform = null,
              container = document.body,
              clickable = true,
              apiBase = "http://localhost:3001",
              siteBase = window.location.origin,
            } = options;

            // Build badge URL
            const params = new URLSearchParams();
            params.set("theme", theme);
            params.set("size", size);
            params.set("style", style);
            if (showTimestamp) params.set("showTimestamp", "true");
            if (showPlatform) params.set("showPlatform", "true");
            if (platform) params.set("platform", platform);

            const badgeUrl = `${apiBase}/api/badge/${hash}/svg?${params.toString()}`;
            const verifyUrl = `${siteBase}/verify?hash=${hash}`;

            // Create elements
            const img = document.createElement("img");
            img.src = badgeUrl;
            img.alt = "Verified on Internet ID";
            img.style.display = "inline-block";

            if (clickable) {
              const link = document.createElement("a");
              link.href = verifyUrl;
              link.target = "_blank";
              link.rel = "noopener noreferrer";
              link.style.display = "inline-block";
              link.style.textDecoration = "none";
              link.appendChild(img);
              container.appendChild(link);
              return link;
            } else {
              container.appendChild(img);
              return img;
            }
          },
        };

        // Make globally accessible
        window.InternetIDBadge = InternetIDBadge;
      })();

      // Usage
      InternetIDBadge.create({
        hash: "0x1234567890abcdef...",
        theme: "dark",
        size: "medium",
        container: document.getElementById("badge-container"),
      });
    </script>
  </body>
</html>
```

### CDN-Hosted Widget (Future Enhancement)

```html
<!-- Load the widget library -->
<script src="https://cdn.internet-id.com/widget/v1/badge.min.js"></script>

<!-- Create badge -->
<div id="my-badge"></div>
<script>
  InternetID.createBadge({
    hash: "0x1234567890abcdef...",
    theme: "blue",
    size: "large",
    container: "#my-badge",
  });
</script>
```

---

## React Component

### Using the Built-in Component

```tsx
import { VerificationBadge } from "@/app/components/VerificationBadge";

function MyComponent() {
  return (
    <div>
      <h1>My Verified Content</h1>
      <VerificationBadge
        hash="0x1234567890abcdef..."
        theme="blue"
        size="large"
        showTimestamp={true}
      />
    </div>
  );
}

export default MyComponent;
```

### Custom React Component

```tsx
import React from "react";

interface BadgeProps {
  hash: string;
  theme?: "dark" | "light" | "blue" | "green" | "purple";
  size?: "small" | "medium" | "large";
}

export function Badge({ hash, theme = "dark", size = "medium" }: BadgeProps) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";
  const badgeUrl = `${apiBase}/api/badge/${hash}/svg?theme=${theme}&size=${size}`;
  const verifyUrl = `/verify?hash=${hash}`;

  return (
    <a href={verifyUrl} target="_blank" rel="noopener noreferrer">
      <img src={badgeUrl} alt="Verified on Internet ID" />
    </a>
  );
}
```

### Using the Badge Hook

```tsx
import { useBadgeUrls } from "@/app/components/VerificationBadge";
import { useState } from "react";

function BadgeEmbed() {
  const hash = "0x1234567890abcdef...";
  const { badgeUrl, verifyUrl, html, markdown } = useBadgeUrls(hash, {
    theme: "blue",
    size: "large",
  });

  const [copied, setCopied] = useState(false);

  const copyMarkdown = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <img src={badgeUrl} alt="Verified" />
      <button onClick={copyMarkdown}>{copied ? "Copied!" : "Copy Markdown"}</button>
    </div>
  );
}
```

---

## Vue Component

### Vue 3 Composition API

```vue
<template>
  <a :href="verifyUrl" target="_blank" rel="noopener noreferrer" class="badge-link">
    <img :src="badgeUrl" alt="Verified on Internet ID" class="badge-image" />
  </a>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  hash: string;
  theme?: "dark" | "light" | "blue" | "green" | "purple";
  size?: "small" | "medium" | "large";
  style?: "flat" | "rounded" | "pill" | "minimal";
}

const props = withDefaults(defineProps<Props>(), {
  theme: "dark",
  size: "medium",
  style: "rounded",
});

const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:3001";
const siteBase = import.meta.env.VITE_SITE_BASE || window.location.origin;

const badgeUrl = computed(() => {
  const params = new URLSearchParams({
    theme: props.theme,
    size: props.size,
    style: props.style,
  });
  return `${apiBase}/api/badge/${props.hash}/svg?${params.toString()}`;
});

const verifyUrl = computed(() => {
  return `${siteBase}/verify?hash=${props.hash}`;
});
</script>

<style scoped>
.badge-link {
  display: inline-block;
  text-decoration: none;
}

.badge-image {
  display: inline-block;
}
</style>
```

### Vue 2 Options API

```vue
<template>
  <a :href="verifyUrl" target="_blank" rel="noopener noreferrer">
    <img :src="badgeUrl" alt="Verified on Internet ID" />
  </a>
</template>

<script>
export default {
  name: "VerificationBadge",
  props: {
    hash: {
      type: String,
      required: true,
    },
    theme: {
      type: String,
      default: "dark",
    },
    size: {
      type: String,
      default: "medium",
    },
  },
  computed: {
    badgeUrl() {
      const apiBase = process.env.VUE_APP_API_BASE || "http://localhost:3001";
      return `${apiBase}/api/badge/${this.hash}/svg?theme=${this.theme}&size=${this.size}`;
    },
    verifyUrl() {
      const siteBase = process.env.VUE_APP_SITE_BASE || window.location.origin;
      return `${siteBase}/verify?hash=${this.hash}`;
    },
  },
};
</script>
```

---

## WordPress

### Using a Shortcode

Add this to your theme's `functions.php`:

```php
<?php
// Internet ID Badge Shortcode
function internetid_badge_shortcode($atts) {
    $atts = shortcode_atts(array(
        'hash' => '',
        'theme' => 'dark',
        'size' => 'medium',
        'style' => 'rounded',
    ), $atts);

    if (empty($atts['hash'])) {
        return '<p>Error: Badge hash is required</p>';
    }

    $api_base = get_option('internetid_api_base', 'http://localhost:3001');
    $site_base = get_option('internetid_site_base', home_url());

    $params = http_build_query(array(
        'theme' => $atts['theme'],
        'size' => $atts['size'],
        'style' => $atts['style']
    ));

    $badge_url = esc_url($api_base . '/api/badge/' . $atts['hash'] . '/svg?' . $params);
    $verify_url = esc_url($site_base . '/verify?hash=' . $atts['hash']);

    return sprintf(
        '<a href="%s" target="_blank" rel="noopener noreferrer"><img src="%s" alt="Verified on Internet ID" style="display: inline-block;" /></a>',
        $verify_url,
        $badge_url
    );
}
add_shortcode('internetid_badge', 'internetid_badge_shortcode');
?>
```

### Usage in WordPress

```
[internetid_badge hash="0x1234567890abcdef..." theme="blue" size="large"]
```

### WordPress Settings Page (Optional)

```php
<?php
// Add settings page
function internetid_settings_page() {
    add_options_page(
        'Internet ID Settings',
        'Internet ID',
        'manage_options',
        'internetid-settings',
        'internetid_settings_page_html'
    );
}
add_action('admin_menu', 'internetid_settings_page');

function internetid_settings_page_html() {
    if (!current_user_can('manage_options')) {
        return;
    }
    ?>
    <div class="wrap">
        <h1>Internet ID Badge Settings</h1>
        <form method="post" action="options.php">
            <?php
            settings_fields('internetid_settings');
            do_settings_sections('internetid-settings');
            submit_button();
            ?>
        </form>
    </div>
    <?php
}

// Register settings
function internetid_register_settings() {
    register_setting('internetid_settings', 'internetid_api_base');
    register_setting('internetid_settings', 'internetid_site_base');

    add_settings_section(
        'internetid_section',
        'Badge Configuration',
        null,
        'internetid-settings'
    );

    add_settings_field(
        'internetid_api_base',
        'API Base URL',
        'internetid_api_base_field',
        'internetid-settings',
        'internetid_section'
    );

    add_settings_field(
        'internetid_site_base',
        'Site Base URL',
        'internetid_site_base_field',
        'internetid-settings',
        'internetid_section'
    );
}
add_action('admin_init', 'internetid_register_settings');

function internetid_api_base_field() {
    $value = get_option('internetid_api_base', 'http://localhost:3001');
    echo '<input type="text" name="internetid_api_base" value="' . esc_attr($value) . '" class="regular-text" />';
}

function internetid_site_base_field() {
    $value = get_option('internetid_site_base', home_url());
    echo '<input type="text" name="internetid_site_base" value="' . esc_attr($value) . '" class="regular-text" />';
}
?>
```

---

## GitHub README

### Basic Badge

```markdown
# My Project

[![Verified on Internet ID](https://api.internet-id.com/api/badge/0x1234.../svg?theme=dark)](https://internet-id.com/verify?hash=0x1234...)

This project's authenticity is verified on-chain.
```

### With Custom Styling

```markdown
## Content Verification

<p align="center">
  <a href="https://internet-id.com/verify?hash=0x1234...">
    <img src="https://api.internet-id.com/api/badge/0x1234.../svg?theme=blue&size=large&style=pill" alt="Verified on Internet ID" />
  </a>
</p>
```

### Multiple Badges

```markdown
## Verified Content

| Content        | Status                                                                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Documentation  | [![Verified](https://api.internet-id.com/api/badge/0x1234.../svg?size=small&theme=green)](https://internet-id.com/verify?hash=0x1234...) |
| Source Code    | [![Verified](https://api.internet-id.com/api/badge/0x5678.../svg?size=small&theme=green)](https://internet-id.com/verify?hash=0x5678...) |
| Release Binary | [![Verified](https://api.internet-id.com/api/badge/0x9abc.../svg?size=small&theme=green)](https://internet-id.com/verify?hash=0x9abc...) |
```

---

## Static HTML

### Simple Embed

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>My Verified Content</title>
  </head>
  <body>
    <article>
      <h1>My Article</h1>
      <p>This content is verified on Internet ID.</p>

      <!-- Verification Badge -->
      <a
        href="https://internet-id.com/verify?hash=0x1234..."
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src="https://api.internet-id.com/api/badge/0x1234.../svg?theme=dark&size=medium"
          alt="Verified on Internet ID"
        />
      </a>
    </article>
  </body>
</html>
```

### With Responsive Sizing

```html
<picture>
  <!-- Small screens: small badge -->
  <source
    media="(max-width: 768px)"
    srcset="https://api.internet-id.com/api/badge/0x1234.../svg?size=small"
  />
  <!-- Medium screens: medium badge -->
  <source
    media="(max-width: 1024px)"
    srcset="https://api.internet-id.com/api/badge/0x1234.../svg?size=medium"
  />
  <!-- Large screens: large badge -->
  <img
    src="https://api.internet-id.com/api/badge/0x1234.../svg?size=large"
    alt="Verified on Internet ID"
  />
</picture>
```

### Hero Section Example

```html
<section class="hero">
  <div class="container">
    <h1>Authentic Content Creator</h1>
    <p>All my content is verified on-chain</p>

    <div class="badge-container">
      <a href="https://internet-id.com/verify?hash=0x1234..." target="_blank">
        <img
          src="https://api.internet-id.com/api/badge/0x1234.../svg?theme=blue&size=large&style=pill"
          alt="Verified Creator"
          style="margin: 20px auto; display: block;"
        />
      </a>
    </div>
  </div>
</section>

<style>
  .hero {
    text-align: center;
    padding: 60px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .badge-container {
    margin-top: 30px;
  }

  .badge-container img {
    transition: transform 0.2s ease;
  }

  .badge-container img:hover {
    transform: scale(1.05);
  }
</style>
```

---

## Best Practices

### 1. Always Link to Verification

Never display a badge without linking to the verification page. Users should be able to verify claims easily.

```html
<!-- Good -->
<a href="https://internet-id.com/verify?hash=0x1234...">
  <img src="badge-url" alt="Verified" />
</a>

<!-- Bad -->
<img src="badge-url" alt="Verified" />
```

### 2. Use Appropriate Alt Text

Provide meaningful alt text for accessibility:

```html
<img src="badge-url" alt="Verified on Internet ID - Content Hash: 0x1234..." />
```

### 3. Cache Badges Appropriately

Respect cache headers but provide a way to refresh if needed:

```javascript
// Add cache-busting parameter for fresh badges
const timestamp = Date.now();
const badgeUrl = `${apiBase}/api/badge/${hash}/svg?theme=dark&_t=${timestamp}`;
```

### 4. Handle Loading States

```javascript
const img = document.createElement("img");
img.src = badgeUrl;
img.alt = "Verified on Internet ID";
img.onerror = () => {
  img.src = "/fallback-badge.svg"; // Provide fallback
};
```

### 5. Responsive Design

Use appropriate sizes for different screen sizes:

```css
.badge {
  max-width: 100%;
  height: auto;
}

@media (max-width: 768px) {
  .badge {
    max-width: 180px; /* Small size on mobile */
  }
}
```

---

## Support

For additional support or custom integration assistance:

- Visit the badge showcase: `/badges`
- Read the API documentation: `docs/BADGE_API.md`
- Open an issue on GitHub

---

## License

These code examples are provided under the MIT License and can be freely used in your projects.
