/**
 * What the simulator should put *inside* each component, and where it needs
 * room to breathe.
 *
 * The props catalogue is generated (see `scripts/extract-props.mjs`), but slot
 * content cannot be - a Tabs with no tabs and a Tree with no rows tell you
 * nothing. Each entry below supplies a sensible body plus the source that body
 * should print as in the generated snippet, so the code you copy is the code
 * that produced the preview.
 */

import { h, type Component, type VNode } from 'vue'
import {
  EvAvatar,
  EvButton,
  EvButtonGroupItem,
  EvCarouselSlide,
  EvDropdownItem,
  EvNavMenuItem,
  EvRadio,
  EvTab,
  EvTag,
  EvToggle,
  EvTreeItem,
} from '../src'
import { EvBarChart } from '../src/charts'

export interface DemoConfig {
  /** Prop values the simulator starts from, on top of the component's own. */
  initial?: Record<string, unknown>
  /** Rendered into the preview. */
  slots?: Record<string, () => VNode | VNode[] | string>
  /** How each slot prints in the generated snippet. */
  slotCode?: Record<string, string>
  /** Extra room, a dark surface, or a fixed frame for the preview stage. */
  stage?: 'default' | 'dark' | 'tall' | 'wide'
  /** Shown above the preview when the component needs an explanation. */
  note?: string
}

const t = (value: string) => () => value

/** A 16px placeholder glyph, for the icon slots every component exposes. */
const icon = (): VNode =>
  h('svg', { viewBox: '0 0 16 16', width: 16, height: 16, 'aria-hidden': 'true' }, [
    h('circle', {
      cx: 8,
      cy: 8,
      r: 6,
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 1.5,
    }),
  ])

const ICON_CODE = '<svg viewBox="0 0 16 16"><!-- ikon 16px --></svg>'

export const SIMULATOR_DEMOS: Record<string, DemoConfig> = {
  // ---------------------------------------------------------------- actions
  EvButton: {
    slots: { default: t('Simpan perubahan') },
    slotCode: { default: 'Simpan perubahan' },
  },
  EvButtonLink: {
    slots: { default: t('Lihat laporan') },
    slotCode: { default: 'Lihat laporan' },
  },
  EvButtonGroup: {
    slots: {
      default: () => [
        h(EvButtonGroupItem, { active: true }, () => 'Harian'),
        h(EvButtonGroupItem, null, () => 'Mingguan'),
        h(EvButtonGroupItem, null, () => 'Bulanan'),
      ],
    },
    slotCode: {
      default: [
        '<EvButtonGroupItem active>Harian</EvButtonGroupItem>',
        '<EvButtonGroupItem>Mingguan</EvButtonGroupItem>',
        '<EvButtonGroupItem>Bulanan</EvButtonGroupItem>',
      ].join('\n'),
    },
  },
  EvButtonGroupItem: {
    slots: { default: t('Mingguan') },
    slotCode: { default: 'Mingguan' },
  },
  EvToggle: { slots: { default: t('Tebal') }, slotCode: { default: 'Tebal' } },
  EvToggleGroup: {
    slots: {
      default: () => [
        h(EvToggle, { modelValue: true }, () => 'Kiri'),
        h(EvToggle, null, () => 'Tengah'),
        h(EvToggle, null, () => 'Kanan'),
      ],
    },
    slotCode: {
      default: [
        '<EvToggle :model-value="true">Kiri</EvToggle>',
        '<EvToggle>Tengah</EvToggle>',
        '<EvToggle>Kanan</EvToggle>',
      ].join('\n'),
    },
  },

  // ------------------------------------------------------------------- form
  EvInput: { initial: { label: 'Nama vendor', placeholder: 'PT Contoh Sejahtera' } },
  EvInputSearch: { initial: { placeholder: 'Cari dokumen...' } },
  EvInputWithLabel: {
    initial: { prefixLabel: 'https://', placeholder: 'domain-anda' },
  },
  EvInputFieldUnit: { initial: { label: 'Nilai kontrak', placeholder: '0' } },
  EvTextarea: { initial: { label: 'Catatan pengadaan', showCount: true, maxlength: 200 } },
  EvRichEditor: {
    initial: { label: 'Spesifikasi teknis', maxlength: 2000 },
    stage: 'wide',
  },
  EvCheckbox: { initial: { label: 'Setuju dengan syarat', subtext: 'Wajib dicentang' } },
  EvRadio: { initial: { value: 'a', label: 'Transfer bank' } },
  EvRadioGroup: {
    initial: { modelValue: 'transfer' },
    slots: {
      default: () => [
        h(EvRadio, { value: 'transfer', label: 'Transfer bank' }),
        h(EvRadio, { value: 'va', label: 'Virtual account' }),
        h(EvRadio, { value: 'tunai', label: 'Tunai', disabled: true }),
      ],
    },
    slotCode: {
      default: [
        '<EvRadio value="transfer" label="Transfer bank" />',
        '<EvRadio value="va" label="Virtual account" />',
        '<EvRadio value="tunai" label="Tunai" disabled />',
      ].join('\n'),
    },
  },
  EvSwitch: {
    initial: { label: 'Notifikasi email', subtext: 'Kirim rangkuman mingguan' },
  },
  EvSlider: { initial: { modelValue: 40, showValue: true }, stage: 'wide' },
  EvCalendar: { stage: 'tall' },
  EvTimePicker: { stage: 'tall' },
  EvDropdownList: {
    slots: {
      default: () => [
        h(EvDropdownItem, { active: true }, () => 'Semua status'),
        h(EvDropdownItem, null, () => 'Menunggu persetujuan'),
        h(EvDropdownItem, null, () => 'Disetujui'),
        h(EvDropdownItem, { disabled: true }, () => 'Dibatalkan'),
      ],
    },
    slotCode: {
      default: [
        '<EvDropdownItem active>Semua status</EvDropdownItem>',
        '<EvDropdownItem>Menunggu persetujuan</EvDropdownItem>',
        '<EvDropdownItem>Disetujui</EvDropdownItem>',
        '<EvDropdownItem disabled>Dibatalkan</EvDropdownItem>',
      ].join('\n'),
    },
  },
  EvDropdownItem: {
    slots: { default: t('Menunggu persetujuan') },
    slotCode: { default: 'Menunggu persetujuan' },
  },

  // ----------------------------------------------------------- data display
  EvBadge: { slots: { default: t('Disetujui') }, slotCode: { default: 'Disetujui' } },
  EvTag: { slots: { default: t('Pengadaan') }, slotCode: { default: 'Pengadaan' } },
  EvTagGroup: {
    slots: {
      default: () => [
        h(EvTag, { removable: true }, () => 'Pengadaan'),
        h(EvTag, { removable: true }, () => 'Q1 2026'),
        h(EvTag, { removable: true }, () => 'Prioritas tinggi'),
      ],
    },
    slotCode: {
      default: [
        '<EvTag removable>Pengadaan</EvTag>',
        '<EvTag removable>Q1 2026</EvTag>',
        '<EvTag removable>Prioritas tinggi</EvTag>',
      ].join('\n'),
    },
  },
  EvKbd: { slots: { default: t('Ctrl') }, slotCode: { default: 'Ctrl' } },
  EvHint: { initial: { value: 8 } },
  EvAvatar: { initial: { label: 'AB', alt: 'Anya Bahar' } },
  EvAvatarGroup: {
    slots: {
      default: () => [
        h(EvAvatar, { label: 'AB', variant: 'blue' }),
        h(EvAvatar, { label: 'CD', variant: 'green' }),
        h(EvAvatar, { label: 'EF', variant: 'orange' }),
        h(EvAvatar, { label: '+5', variant: 'number' }),
      ],
    },
    slotCode: {
      default: [
        '<EvAvatar label="AB" variant="blue" />',
        '<EvAvatar label="CD" variant="green" />',
        '<EvAvatar label="EF" variant="orange" />',
        '<EvAvatar label="+5" variant="number" />',
      ].join('\n'),
    },
  },
  EvCard: {
    initial: { title: 'Pengadaan Server', description: 'Diajukan 12 Mar 2026' },
    slots: {
      default: t('Total nilai kontrak Rp 1.240.000.000 untuk 24 unit.'),
      footer: () => [
        h(EvButton, { variant: 'secondary-light', size: 'small' }, () => 'Batal'),
        h(EvButton, { size: 'small' }, () => 'Setujui'),
      ],
    },
    slotCode: {
      default: 'Total nilai kontrak Rp 1.240.000.000 untuk 24 unit.',
      footer: [
        '<EvButton variant="secondary-light" size="small">Batal</EvButton>',
        '<EvButton size="small">Setujui</EvButton>',
      ].join('\n'),
    },
    stage: 'wide',
  },
  EvTree: {
    slots: {
      default: () => [
        h(EvTreeItem, { level: 1, label: 'Dokumen', expanded: true }),
        h(EvTreeItem, { level: 2, label: 'Kontrak.pdf', hasChild: false }),
        h(EvTreeItem, { level: 2, label: 'Lampiran', selected: true }),
        h(EvTreeItem, { level: 3, label: 'Spesifikasi.xlsx', hasChild: false }),
      ],
    },
    slotCode: {
      default: [
        '<EvTreeItem :level="1" label="Dokumen" expanded />',
        '<EvTreeItem :level="2" label="Kontrak.pdf" :has-child="false" />',
        '<EvTreeItem :level="2" label="Lampiran" selected />',
        '<EvTreeItem :level="3" label="Spesifikasi.xlsx" :has-child="false" />',
      ].join('\n'),
    },
    stage: 'wide',
  },
  EvTreeItem: { initial: { label: 'Lampiran' }, stage: 'wide' },
  EvAspectRatio: {
    slots: { default: t('Slot media 16:9') },
    slotCode: { default: '<img src="/foto.jpg" alt="" />' },
    stage: 'wide',
  },
  EvSeparator: { stage: 'wide' },
  EvScrollArea: {
    slots: {
      default: () =>
        h(
          'div',
          { style: 'padding:8px' },
          Array.from({ length: 12 }, (_, i) =>
            h('p', { style: 'margin:0 0 8px' }, `Baris ${i + 1}`),
          ),
        ),
    },
    slotCode: { default: '<p v-for="n in 12" :key="n">Baris {{ n }}</p>' },
    stage: 'tall',
  },
  EvLogo: {},
  EvChart: {
    initial: { title: 'Realisasi Anggaran', subtext: 'Jan - Jun 2026' },
    slots: {
      default: () =>
        h(EvBarChart, {
          data: [
            { bulan: 'Jan', realisasi: 42 },
            { bulan: 'Feb', realisasi: 61 },
            { bulan: 'Mar', realisasi: 38 },
            { bulan: 'Apr', realisasi: 74 },
          ],
          category: 'bulan',
          series: ['realisasi'],
          label: 'Realisasi bulanan',
        }),
    },
    slotCode: {
      default: '<EvBarChart :data="data" category="bulan" :series="[\'realisasi\']" />',
    },
    stage: 'wide',
  },
  EvBarChart: {
    initial: {
      data: [
        { bulan: 'Jan', realisasi: 42 },
        { bulan: 'Feb', realisasi: 61 },
        { bulan: 'Mar', realisasi: 38 },
      ],
      category: 'bulan',
      series: ['realisasi'],
    },
    stage: 'wide',
  },
  EvLineChart: {
    initial: {
      data: [
        { bulan: 'Jan', realisasi: 42 },
        { bulan: 'Feb', realisasi: 61 },
        { bulan: 'Mar', realisasi: 38 },
      ],
      category: 'bulan',
      series: ['realisasi'],
    },
    stage: 'wide',
  },
  EvPieChart: {
    initial: {
      data: [
        { nama: 'Disetujui', nilai: 62 },
        { nama: 'Menunggu', nilai: 24 },
        { nama: 'Ditolak', nilai: 14 },
      ],
      category: 'nama',
      value: 'nilai',
    },
    stage: 'wide',
  },

  // ------------------------------------------------------------- navigation
  EvBreadcrumb: {
    initial: {
      items: [
        { label: 'Beranda', href: '#', icon: true },
        { label: 'Pengadaan', href: '#' },
        { label: 'Detail' },
      ],
    },
    stage: 'wide',
  },
  EvTabs: {
    initial: { modelValue: 'ringkasan' },
    slots: {
      default: () => [
        h(EvTab, { value: 'ringkasan' }, () => 'Ringkasan'),
        h(EvTab, { value: 'dokumen' }, () => 'Dokumen'),
        h(EvTab, { value: 'riwayat' }, () => 'Riwayat'),
      ],
    },
    slotCode: {
      default: [
        '<EvTab value="ringkasan">Ringkasan</EvTab>',
        '<EvTab value="dokumen">Dokumen</EvTab>',
        '<EvTab value="riwayat">Riwayat</EvTab>',
      ].join('\n'),
    },
    stage: 'wide',
  },
  EvTab: {
    initial: { value: 'ringkasan' },
    slots: { default: t('Ringkasan') },
    slotCode: { default: 'Ringkasan' },
  },
  EvCarousel: {
    slots: {
      default: () => [
        h(EvCarouselSlide, null, () => 'Slide 1'),
        h(EvCarouselSlide, null, () => 'Slide 2'),
        h(EvCarouselSlide, null, () => 'Slide 3'),
      ],
    },
    slotCode: {
      default: [
        '<EvCarouselSlide>Slide 1</EvCarouselSlide>',
        '<EvCarouselSlide>Slide 2</EvCarouselSlide>',
        '<EvCarouselSlide>Slide 3</EvCarouselSlide>',
      ].join('\n'),
    },
    stage: 'wide',
  },
  EvCarouselSlide: {
    slots: { default: t('Slide 1') },
    slotCode: { default: 'Slide 1' },
    stage: 'wide',
  },
  EvNavigationMenu: {
    slots: {
      default: () => [
        h(EvNavMenuItem, { active: true }, () => 'Beranda'),
        h(EvNavMenuItem, null, () => 'Pengadaan'),
        h(EvNavMenuItem, null, () => 'Laporan'),
      ],
    },
    slotCode: {
      default: [
        '<EvNavMenuItem active>Beranda</EvNavMenuItem>',
        '<EvNavMenuItem>Pengadaan</EvNavMenuItem>',
        '<EvNavMenuItem>Laporan</EvNavMenuItem>',
      ].join('\n'),
    },
    stage: 'wide',
  },
  EvNavMenuItem: { slots: { default: t('Pengadaan') }, slotCode: { default: 'Pengadaan' } },

  // -------------------------------------------------------------- feedback
  EvAccordion: {
    initial: { title: 'Syarat dan ketentuan', subtext: 'Berlaku sejak 1 Jan 2026' },
    slots: { default: t('Isi panel muncul ketika accordion dibuka.') },
    slotCode: { default: 'Isi panel muncul ketika accordion dibuka.' },
    stage: 'wide',
  },
  EvAlert: {
    initial: { title: 'Pengajuan terkirim', subtext: 'Menunggu persetujuan atasan.' },
    stage: 'wide',
  },
  EvTooltip: {
    initial: { text: 'Menyimpan tanpa menutup formulir', open: true },
    slots: { default: () => h(EvButton, { variant: 'secondary-light' }, () => 'Arahkan ke sini') },
    slotCode: { default: '<EvButton variant="secondary-light">Arahkan ke sini</EvButton>' },
    stage: 'tall',
    note: 'Prop `open` dikunci true supaya bubble-nya terlihat tanpa perlu hover.',
  },
  EvPopover: {
    initial: { title: 'Ubah nama', description: 'Nama tampil di seluruh laporan.' },
    slots: { default: t('Taruh formulir singkat di sini.') },
    slotCode: { default: 'Taruh formulir singkat di sini.' },
    stage: 'tall',
    note: 'Klik pemicunya untuk membuka panel.',
  },
  EvModal: {
    initial: { title: 'Setujui pengajuan?', subtext: 'Tindakan ini tercatat di riwayat.' },
    slots: { default: t('Isi modal.') },
    slotCode: { default: 'Isi modal.' },
    note: 'Nyalakan `modelValue` di panel kontrol untuk membukanya.',
  },
  EvDrawer: {
    initial: { title: 'Detail vendor', subtext: 'PT Contoh Sejahtera' },
    slots: { default: t('Isi drawer.') },
    slotCode: { default: 'Isi drawer.' },
    note: 'Nyalakan `modelValue` di panel kontrol untuk membukanya.',
  },
  EvAlertDialog: {
    initial: { title: 'Hapus dokumen?', description: 'Dokumen tidak bisa dikembalikan.' },
    note: 'Nyalakan `modelValue` di panel kontrol untuk membukanya.',
  },
  EvDirection: {
    initial: { title: 'Lengkapi profil', subtext: 'Tiga isian lagi sebelum bisa mengajukan.' },
    slots: { default: t('Taruh isian formulir di sini.') },
    slotCode: { default: 'Taruh isian formulir di sini.' },
    stage: 'wide',
  },
}

/** Slot content that is safe to hand any component with an icon slot. */
export const ICON_SLOT = { render: icon, code: ICON_CODE }

export type { Component }
