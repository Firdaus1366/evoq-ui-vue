export type EvSize = 'sm' | 'md' | 'lg'

/**
 * Button variants, mirroring the `Variant` property of the Figma component set.
 *
 * The three `secondary-*` entries are genuinely distinct in the design - they
 * differ in resting fill and border, not just in shade.
 */
export type ButtonVariant =
  | 'primary'
  | 'secondary-light'
  | 'secondary-grey'
  | 'secondary-white'
  | 'destructive'
  | 'outline'
  | 'ghost'

/** The Figma set ships two control heights: 40px (`default`) and 32px (`small`). */
export type ButtonSize = 'default' | 'small'

/** `Orientation` of the Figma `Separator` set. */
export type SeparatorOrientation = 'horizontal' | 'vertical'

/** `Variant` of the Figma `Kbd` set - a text cap or a square icon cap. */
export type KbdVariant = 'text' | 'icon'

/**
 * `Variant` of the Figma `Badge` set. These are workflow statuses, not generic
 * intents, which is why `draft` and `waiting` appear instead of `info`/`pending`.
 */
export type BadgeVariant = 'success' | 'waiting' | 'neutral' | 'draft' | 'reject' | 'custom'

/** `Variant` of the Figma `Tag` set. */
export type TagVariant = 'default' | 'outline'

/** `Spacing` of the Figma `TagGroup` set. */
export type TagGroupSpacing = 'default' | 'loose'

/** `Type` of the Figma `TagGroup` set. */
export type TagGroupType = 'wrap' | 'scroll'

/** `Size` of the Figma `Hint` set. */
export type HintSize = 'small' | 'medium' | 'large'

/** `Ratio` of the Figma `Aspect Ratio` set. */
export type AspectRatio = '16:9' | '9:16' | '4:5' | '5:4' | '1:1'

/** `Variant` of the Figma `ButtonLink` set. */
export type ButtonLinkVariant = 'primary' | 'secondary' | 'tertiary' | 'invert' | 'custom'

/** `Size` of the Figma `.Switch` set. */
export type SwitchSize = 'default' | 'small'

/** `Variant` of the Figma `Toggle` set. */
export type ToggleVariant = 'default' | 'outline'

/** `Size` of the Figma `Toggle` set. */
export type ToggleSize = 'default' | 'small'

/** `Type` of the Figma `Card` set. */
export type CardType = 'default' | 'small' | 'image'

/** `Variant` of the Figma `Accordion` set. */
export type AccordionVariant = 'default' | 'card'

/**
 * `Variant` of the Figma `Alert` set. `neutral-dark` is a distinct variant, not
 * the dark-theme rendering of `neutral`.
 */
export type AlertVariant = 'neutral' | 'neutral-dark' | 'info' | 'success' | 'error' | 'warning'

/** One crumb in an `EvBreadcrumb`. */
export interface BreadcrumbItem {
  label: string
  href?: string
  /** Rendered instead of the label - used for the leading home crumb. */
  icon?: boolean
}

/** `Variant` of the Figma `Tabs` set. */
export type TabsVariant = 'segmented' | 'line'

/** `Variant` of the Figma `Tooltip` set - which side the bubble sits on. */
export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

/** `Type` of the Figma `Scroll` set. */
export type ScrollOrientation = 'vertical' | 'horizontal' | 'both'

/** `Size` of the Figma `D - Modal` set. */
export type ModalSize = 'small' | 'medium' | 'large'

/** `Size` of the Figma `D- Drawer` set. */
export type DrawerSize = 'default' | 'wide'

/**
 * Which edge the drawer slides from. Figma draws the desktop drawer on the
 * right (`D- Drawer`) and the mobile one as a bottom sheet (`M- Drawer`).
 */
export type DrawerPlacement = 'right' | 'left' | 'bottom'

/** `Variant` of the Figma `AlertDialog` sets. */
export type AlertDialogVariant = 'success' | 'warning' | 'confirmation' | 'info' | 'delete'

/**
 * `Variant` of the Figma `Slider` set, minus `Disabled` - that is a state, so
 * it is a `disabled` prop rather than a variant.
 */
export type SliderVariant = 'primary' | 'destructive'

/**
 * The axis of a slider. Figma folds this into its `Type` property alongside
 * `Range`, which is why that set has no vertical range; splitting them reaches
 * every drawn variant plus the one the board could not express.
 */
export type SliderOrientation = 'horizontal' | 'vertical'

/**
 * `Variant` of the Figma `.List Text` set - the plain 24px row, or the taller
 * 32px row used once a checkbox or avatar sits beside the label.
 */
export type DropdownItemVariant = 'list' | 'list-box'

/** `Variant` of the Figma `Carousel` set - the axis the track scrolls along. */
export type CarouselOrientation = 'horizontal' | 'vertical'

/** `Size` of the Figma `Avatar` set, in pixels. */
export type AvatarSize = 24 | 32 | 40 | 48 | 64 | 96

/**
 * `Variant` of the Figma `Avatar` set. The six colours are initials avatars;
 * `number`, `empty` and `error` are the three grey states.
 */
export type AvatarVariant =
  'green' | 'blue' | 'orange' | 'purple' | 'teal' | 'pink' | 'number' | 'empty' | 'error'

/** `Variant` of the Figma `ButtonGroup Item` set. */
export type ButtonGroupVariant =
  'default-light' | 'default-white' | 'primary' | 'destructive' | 'warning'

/** `Size` of the Figma `ButtonGroup Item` set. */
export type ButtonGroupSize = 'large' | 'small'

/** `Variant` of the Figma `Chart` container set. */
export type ChartVariant = 'card' | 'no-card'

/** Selection mode of `EvCalendar` - Figma's `Basic` and `Range` variants. */
export type CalendarMode = 'single' | 'range'

/** Format of `EvTimePicker`. */
export type TimePickerFormat = 'default' | 'with-seconds' | 'am-pm' | 'am-pm-seconds'

/** Control size for `EvInput` per Figma spec (44px default or 32px small). */
export type InputSize = 'default' | 'small'

/** Placement for `EvInputWithLabel` inline label addons. */
export type InputWithLabelPlacement = 'left' | 'right' | 'both'

/** Unit option for `EvInputFieldUnit`. */
export interface UnitOption {
  label: string
  value: string
}
