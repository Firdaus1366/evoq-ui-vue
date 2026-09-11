/**
 * The hand-kept half of the component docs: which Figma documentation and
 * component sets each Vue component translates, how components nest, and the
 * words people search for it by. Everything else in a doc - props, slots,
 * events, layer, composition, examples - is read from the code by
 * `scripts/build-docs.mjs`, so it cannot drift.
 *
 * - `figma`   key into `design/figma-component-docs.json` (its Documentation frame)
 * - `sets`    the Figma component sets / components this Vue component renders
 * - `summary` only where the Figma frame has no summary line, or where its
 *             summary describes a different component (a Group sharing its
 *             item's page). It wins over Figma's and is marked `code` in the doc
 * - `children` components the default slot is built to hold
 * - `partOf`  the parent a part component is used inside
 * - `keywords` extra search terms for `search_components`
 */

const s = (name, id, page) => ({ name, id, page })

export const SOURCES = {
  // ------------------------------------------------------------------ atoms
  EvAspectRatio: {
    figma: 'Aspect Ratio',
    sets: [s('Aspect Ratio', '820:3124', 'Aspect Ratio')],
    summary:
      'A box that holds one media element at a fixed width-to-height ratio, filling it with the media and clipping the overflow.',
    keywords: ['ratio', 'media', 'image', 'video', 'embed', '16:9'],
  },
  EvAvatar: {
    figma: 'Avatar',
    sets: [s('Avatar', '497:979', 'Avatar')],
    keywords: ['user', 'profile', 'initials', 'photo', 'person'],
  },
  EvBadge: {
    figma: 'Badge',
    sets: [s('Badge', '72:1516', 'Badge')],
    keywords: ['status', 'label', 'pill', 'chip', 'state'],
  },
  EvButton: {
    figma: 'Button',
    sets: [s('Button', '114:2645', 'Button')],
    keywords: ['action', 'submit', 'cta', 'btn', 'primary', 'destructive'],
  },
  EvButtonGroupItem: {
    figma: 'Button Group',
    sets: [s('ButtonGroup Item', '749:4128', 'Button Group')],
    summary:
      'One segment of a ButtonGroup - a button that takes its variant and size from the group around it.',
    partOf: 'EvButtonGroup',
    keywords: ['segment', 'pagination item'],
  },
  EvButtonLink: {
    figma: 'Button Link',
    sets: [s('ButtonLink', '480:3197', 'Button Link')],
    keywords: ['link', 'anchor', 'text button', 'href'],
  },
  EvCheckbox: {
    figma: 'Checkbox',
    sets: [s('Checkbox', '504:4181', 'Checkbox')],
    keywords: ['check', 'multi select', 'tick', 'indeterminate'],
  },
  EvDropdownItem: {
    figma: 'Dropdown List',
    sets: [s('.List Text', '668:8826', 'Dropdown List')],
    summary:
      'One row of a DropdownList: an option in a listbox, or a menu item - a real link when given an href - inside a menu.',
    partOf: 'EvDropdownList',
    keywords: ['option', 'menu item', 'list item', 'select option'],
  },
  EvHint: {
    figma: 'Hint',
    sets: [s('Hint', '658:1960', 'Hint')],
    keywords: ['notification', 'dot', 'count', 'unread', 'badge count'],
  },
  EvInput: {
    figma: 'Input Field',
    sets: [s('InputField', '85:2484', 'Input')],
    keywords: ['text field', 'input', 'form', 'textbox', 'field'],
  },
  EvInputSearch: {
    figma: 'InputSearch',
    sets: [s('InputSearch', '750:2949', 'Input')],
    keywords: ['search', 'filter', 'query', 'lookup'],
  },
  EvInputWithLabel: {
    figma: 'Input With Label',
    sets: [s('InputWithLabel', '368:6832', 'Input')],
    keywords: ['addon', 'prefix', 'suffix', 'inline label'],
  },
  EvKbd: {
    figma: 'Kbd',
    sets: [s('Kbd', '2637:2613', 'Kbd')],
    keywords: ['keyboard', 'shortcut', 'key', 'hotkey'],
  },
  EvLogo: {
    figma: null,
    sets: [s('EVOQ-Logo', '5092:66984', 'Logo'), s('Datasea-Logo', '5092:41618', 'Logo')],
    summary:
      'The EVOQ brand mark as an inline SVG; put your own wordmark in its default slot to form the full lockup.',
    keywords: ['brand', 'logo', 'mark'],
  },
  EvNavMenuItem: {
    figma: 'Navigation Menu',
    sets: [s('.TabMenubar', '2065:2424', 'Navigation Menu - Desktop')],
    summary:
      'One destination in a NavigationMenu - a link when given an href, marked as the current section when active.',
    partOf: 'EvNavigationMenu',
    keywords: ['nav item', 'menu link', 'top bar item'],
  },
  EvRadio: {
    figma: 'Radio Button',
    sets: [s('RadioButton', '555:3529', 'Radio Group')],
    partOf: 'EvRadioGroup',
    keywords: ['radio', 'single select', 'option'],
  },
  EvScrollArea: {
    figma: 'Scroll',
    sets: [s('Scroll', '2037:4', 'Scrollbar')],
    keywords: ['scrollbar', 'overflow', 'scroll container'],
  },
  EvSeparator: {
    figma: 'Separator',
    sets: [s('Separator', '194:756', 'Separator')],
    keywords: ['divider', 'rule', 'line', 'hr'],
  },
  EvSlider: {
    figma: 'Slider',
    sets: [s('Slider', '434:7617', 'Slider')],
    keywords: ['range', 'track', 'handle', 'min max'],
  },
  EvSwitch: {
    figma: 'Switch',
    sets: [s('SwitchField', '504:8352', 'Switch')],
    keywords: ['toggle switch', 'on off', 'setting'],
  },
  EvTab: {
    figma: 'Tabs',
    sets: [s('.TabItem', '434:5262', 'Tabs')],
    summary:
      'One tab in a Tabs strip; its value selects it, and it takes the variant from the Tabs around it.',
    partOf: 'EvTabs',
    keywords: ['tab item'],
  },
  EvTag: {
    figma: 'Tag',
    sets: [s('Tag', '3050:6361', 'Tag')],
    partOf: 'EvTagGroup',
    keywords: ['chip', 'keyword', 'filter chip', 'removable'],
  },
  EvTextarea: {
    figma: 'Input Text Area',
    sets: [s('InputTextArea', '487:6751', 'Input')],
    keywords: ['multiline', 'textarea', 'notes', 'counter'],
  },
  EvToggle: {
    figma: 'Toggle',
    sets: [s('Toggle', '2855:1224', 'Toggle')],
    partOf: 'EvToggleGroup',
    keywords: ['toggle button', 'pressed', 'on off button'],
  },

  // -------------------------------------------------------------- molecules
  EvAccordion: {
    figma: 'Accordion',
    sets: [s('Accordion', '2473:2493', 'Accordion')],
    summary:
      'A collapsible section: a header button with a title and optional subtext that shows or hides its panel.',
    keywords: ['collapse', 'expand', 'disclosure', 'faq'],
  },
  EvAlert: {
    figma: 'Alert',
    sets: [s('Alert', '681:11285', 'Alert')],
    keywords: ['banner', 'message', 'notice', 'callout', 'status message'],
  },
  EvAvatarGroup: {
    figma: 'Avatar',
    sets: [s('AvatarGroup', '504:705', 'Avatar')],
    summary: 'A labelled, overlapping stack of avatars that share one size.',
    children: ['EvAvatar'],
    keywords: ['avatar stack', 'people', 'members'],
  },
  EvButtonGroup: {
    figma: 'Button Group',
    sets: [s('ButtonGroup', '749:4513', 'Button Group')],
    children: ['EvButtonGroupItem'],
    keywords: ['segmented', 'pagination', 'button bar'],
  },
  EvDropdownList: {
    figma: 'Dropdown List',
    sets: [s('DropdownList', '668:8852', 'Dropdown List')],
    summary:
      'A floating list panel - a listbox of options to choose from, or a menu of actions and links - with optional search, scrolling and an empty state.',
    children: ['EvDropdownItem'],
    keywords: ['select', 'menu', 'options', 'listbox', 'combobox', 'popover list'],
  },
  EvInputFieldUnit: {
    figma: 'InputFieldUnit',
    sets: [s('InputFieldUnit', '702:3937', 'Input')],
    keywords: ['unit', 'currency', 'amount', 'measure'],
  },
  EvPopover: {
    figma: 'Popover',
    sets: [s('D - Popover', '2057:3539', 'Popover')],
    keywords: ['floating panel', 'flyout', 'overlay'],
  },
  EvRadioGroup: {
    figma: 'Radio Button',
    sets: [],
    summary:
      'Holds a set of radios under one name and one v-model, so exactly one of them is chosen.',
    children: ['EvRadio'],
    keywords: ['radio group', 'single choice'],
  },
  EvTabs: {
    figma: 'Tabs',
    sets: [s('Tabs', '434:6135', 'Tabs')],
    children: ['EvTab'],
    keywords: ['tab bar', 'segmented', 'views'],
  },
  EvTagGroup: {
    figma: 'Tag',
    sets: [s('TagGroup', '3050:6644', 'Tag')],
    summary: 'Lays out a set of tags, wrapping or scrolling, and hands them one shared variant.',
    children: ['EvTag'],
    keywords: ['chips', 'tag list', 'filters'],
  },
  EvToggleGroup: {
    figma: 'Toggle',
    sets: [s('ToggleGroup', '2864:12585', 'Toggle')],
    summary: 'A labelled row of toggles that share one variant and size.',
    children: ['EvToggle'],
    keywords: ['toolbar', 'view switcher', 'formatting'],
  },
  EvTooltip: {
    figma: 'Tooltip',
    sets: [s('Tooltip', '479:2624', 'Tooltip')],
    keywords: ['hint', 'hover', 'info', 'popup text'],
  },

  // -------------------------------------------------------------- organisms
  EvAlertDialog: {
    figma: 'Alert Dialog',
    sets: [
      s('D - AlertDialog', '2519:1822', 'Alert Dialog'),
      s('M - AlertDialog', '2519:2209', 'Alert Dialog'),
    ],
    summary:
      'A blocking dialog that asks the user to confirm or decide - traps focus, closes on Escape, and restores focus on close.',
    keywords: ['confirm', 'dialog', 'delete confirmation', 'modal'],
  },
  EvBreadcrumb: {
    figma: 'Breadcrumb',
    sets: [s('Breadcrumb', '681:10168', 'Breadcrumb')],
    keywords: ['path', 'trail', 'hierarchy', 'navigation'],
  },
  EvCalendar: {
    figma: 'Calendar & Time Picker',
    sets: [
      s('D - Calendar', '2561:1340', 'Calendar & Time Picker'),
      s('M - CalendarPopup', '2577:1585', 'Calendar & Time Picker'),
      s('M- CalendarDrawer', '2844:5830', 'Calendar & Time Picker'),
    ],
    summary:
      'A date picker for a single date or a range, with day, month, year and full-calendar views, presets, and desktop and mobile layouts.',
    keywords: ['date picker', 'datepicker', 'date range', 'calendar'],
  },
  EvCard: {
    figma: 'Card',
    sets: [s('Card', '93:157', 'Card')],
    summary:
      'A bordered block that frames one subject: optional image, title and description, header action, body and footer.',
    keywords: ['panel', 'tile', 'container', 'box'],
  },
  EvCarousel: {
    figma: 'Carousel',
    sets: [s('Carousel', '2344:1404', 'Carousel')],
    children: ['EvCarouselSlide'],
    keywords: ['slider', 'gallery', 'slideshow'],
  },
  EvCarouselSlide: {
    figma: 'Carousel',
    sets: [],
    summary: "One slide of a Carousel, drawn as an Aspect Ratio box at the carousel's ratio.",
    partOf: 'EvCarousel',
    keywords: ['slide'],
  },
  EvChart: {
    figma: 'Chart',
    sets: [s('Chart', '3404:2299', 'Chart')],
    summary:
      'The titled frame a chart sits in: title, subtext, header action, summary and legend around the chart slot.',
    children: ['EvBarChart', 'EvLineChart', 'EvPieChart'],
    keywords: ['chart card', 'graph container', 'dashboard tile'],
  },
  EvDirection: {
    figma: 'Direction',
    sets: [s('Direction', '2504:3364', 'Direction')],
    summary:
      'A panel that guides one short task: title and subtext, an optional header action, a body, and confirm / cancel footer slots.',
    keywords: ['guided task', 'instruction panel', 'step'],
  },
  EvDrawer: {
    figma: 'Drawer',
    sets: [s('D- Drawer', '2930:20688', 'Drawer'), s('M- Drawer', '2616:13119', 'Drawer')],
    summary:
      'A panel that slides in from the right, left or bottom over a scrim - traps focus, closes on Escape, and restores focus on close.',
    keywords: ['side panel', 'sheet', 'bottom sheet', 'offcanvas'],
  },
  EvModal: {
    figma: 'Modal',
    sets: [s('D - Modal', '2123:1992', 'Modal'), s('M - Modal', '2124:2190', 'Modal')],
    keywords: ['dialog', 'overlay', 'popup window'],
  },
  EvNavigationMenu: {
    figma: 'Navigation Menu',
    sets: [s('D - NavigationMenu', '2968:2895', 'Navigation Menu - Desktop')],
    children: ['EvNavMenuItem'],
    keywords: ['navbar', 'header', 'top bar', 'app bar'],
  },
  EvRichEditor: {
    figma: 'InputRichEditor',
    sets: [s('InputRichEditor', '665:2254', 'Input'), s('.RichEditor', '651:2851', 'Input')],
    keywords: ['wysiwyg', 'text editor', 'formatting', 'rich text'],
  },
  EvTimePicker: {
    figma: 'Calendar & Time Picker',
    sets: [
      s('M - TimePickerPopup', '2579:14063', 'Calendar & Time Picker'),
      s('M- TimePickerDrawer', '2844:6656', 'Calendar & Time Picker'),
    ],
    summary:
      'A scrolling wheel for picking a time - 24-hour, with seconds, or AM/PM - with Apply and Cancel.',
    keywords: ['time', 'clock', 'hour minute', 'timepicker'],
  },
  EvTree: {
    figma: 'Tree',
    sets: [s('Tree', '2481:7383', 'Tree')],
    children: ['EvTreeItem'],
    keywords: ['hierarchy', 'file tree', 'nested list', 'explorer'],
  },
  EvTreeItem: {
    figma: 'Tree',
    sets: [],
    summary:
      'One row of a Tree: indented by level, with a chevron that expands its children and an optional checkbox for selection.',
    partOf: 'EvTree',
    keywords: ['tree row', 'node'],
  },

  // --------------------------------------------------------- charts entry
  EvBarChart: {
    figma: 'Chart',
    sets: [s('BarChart', '3398:521', 'Chart')],
    summary: 'A bar chart - grouped or stacked - drawn in SVG from an array of records.',
    partOf: 'EvChart',
    keywords: ['bar', 'column chart', 'histogram', 'graph'],
  },
  EvLineChart: {
    figma: 'Chart',
    sets: [s('LineChart', '3398:1486', 'Chart')],
    summary: 'A line or area chart for trends over time, drawn in SVG from an array of records.',
    partOf: 'EvChart',
    keywords: ['line', 'trend', 'area chart', 'time series', 'graph'],
  },
  EvPieChart: {
    figma: 'Chart',
    sets: [s('PieChart', '3404:1813', 'Chart')],
    summary: 'A pie or doughnut chart for part-to-whole proportions, drawn in SVG.',
    partOf: 'EvChart',
    keywords: ['pie', 'doughnut', 'donut', 'proportion', 'graph'],
  },
}

/**
 * Names the Figma prose uses in "use X instead" advice, mapped to the Vue
 * component they mean. A name missing here is not part of evoq-ui, and the doc
 * says so rather than guessing.
 */
export const FIGMA_NAMES = {
  Button: 'EvButton',
  Link: 'EvButtonLink',
  Toggle: 'EvToggle',
  Switch: 'EvSwitch',
  Checkbox: 'EvCheckbox',
  Radio: 'EvRadio',
  'radio group': 'EvRadioGroup',
  'radio buttons': 'EvRadioGroup',
  Badge: 'EvBadge',
  Avatar: 'EvAvatar',
  Tabs: 'EvTabs',
  Tooltip: 'EvTooltip',
  Popover: 'EvPopover',
  Modal: 'EvModal',
  Alert: 'EvAlert',
  'Alert Dialog': 'EvAlertDialog',
  Drawer: 'EvDrawer',
  Card: 'EvCard',
  Slider: 'EvSlider',
  // Not `Hint`: the Alert doc's "use Hint" means a field's validation text,
  // while EvHint is the notification dot. Linking them would mislead.
  'Notification dot': 'EvHint',
  'Nav menu': 'EvNavigationMenu',
  InputField: 'EvInput',
  InputTextArea: 'EvTextarea',
  InputRichEditor: 'EvRichEditor',
  InputSearch: 'EvInputSearch',
  'bar chart': 'EvBarChart',
}
