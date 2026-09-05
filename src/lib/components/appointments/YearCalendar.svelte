<script lang="ts">
  import {
    format,
    startOfYear,
    endOfYear,
    eachMonthOfInterval,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameDay,
    isToday,
  } from 'date-fns'
  import type { Locale } from 'date-fns'
  import { SvelteMap, SvelteSet } from 'svelte/reactivity'
  import ChevronLeft from '@lucide/svelte/icons/chevron-left'
  import ChevronRight from '@lucide/svelte/icons/chevron-right'
  import { i18n } from '$lib/i18n.svelte'
  import { APPOINTMENT_TYPES } from '$lib/constants'
  import type { Appointment } from '$lib/types'

  let {
    appointments,
    selectedDate,
    dateLocale,
    onSelectDate,
  }: {
    appointments: Appointment[]
    selectedDate: Date
    dateLocale: Locale
    onSelectDate: (date: Date) => void
  } = $props()

  let year = $state(new Date().getFullYear())

  let months = $derived(
    eachMonthOfInterval({
      start: startOfYear(new Date(year, 0, 1)),
      end: endOfYear(new Date(year, 0, 1)),
    })
  )

  let appointmentsByDate = $derived.by(() => {
    const map = new SvelteMap<string, Appointment[]>()
    for (const apt of appointments) {
      const key = format(new Date(apt.date), 'yyyy-MM-dd')
      const list = map.get(key)
      if (list) {
        list.push(apt)
      } else {
        map.set(key, [apt])
      }
    }
    return map
  })

  let weekdayLabels = $derived(
    eachDayOfInterval({
      start: startOfWeek(new Date(), { weekStartsOn: 1 }),
      end: endOfWeek(new Date(), { weekStartsOn: 1 }),
    }).map((d) => format(d, 'EEEEE', { locale: dateLocale }))
  )

  function monthDays(month: Date) {
    return eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  }

  function dayAppointments(day: Date) {
    return appointmentsByDate.get(format(day, 'yyyy-MM-dd')) ?? []
  }

  function dayColors(day: Date) {
    const colors = new SvelteSet<string>()
    for (const apt of dayAppointments(day)) {
      colors.add(APPOINTMENT_TYPES[apt.type]?.color ?? '#6B7280')
    }
    return [...colors].slice(0, 3)
  }
</script>

<div class="year-nav">
  <button type="button" class="year-btn" onclick={() => (year -= 1)} aria-label="←">
    <ChevronLeft size={18} />
  </button>
  <span class="year-label">{year}</span>
  <button type="button" class="year-btn" onclick={() => (year += 1)} aria-label="→">
    <ChevronRight size={18} />
  </button>
</div>

<div class="legend">
  {#each Object.entries(APPOINTMENT_TYPES) as [type, info] (type)}
    <div class="legend-item">
      <span class="legend-dot" style="background:{info.color}"></span>
      {i18n.t('appointments.types.' + type)}
    </div>
  {/each}
</div>

<div class="months-grid">
  {#each months as month (month.toISOString())}
    <div class="month">
      <p class="month-name">{format(month, 'MMMM', { locale: dateLocale })}</p>
      <div class="weekdays">
        {#each weekdayLabels as label, i (i)}
          <span>{label}</span>
        {/each}
      </div>
      <div class="days">
        {#each Array((startOfMonth(month).getDay() + 6) % 7) as _, i (i)}
          <span class="day empty"></span>
        {/each}
        {#each monthDays(month) as day (day.toISOString())}
          {@const colors = dayColors(day)}
          <button
            type="button"
            class="day"
            class:today={isToday(day)}
            class:selected={isSameDay(day, selectedDate)}
            onclick={() => onSelectDate(day)}
          >
            <span class="day-num" style={colors.length && !isToday(day) ? `color:${colors[0]}` : ''}
              >{format(day, 'd')}</span
            >
            {#if colors.length}
              <span class="dots">
                {#each colors as color (color)}
                  <span class="dot" style="background:{color}"></span>
                {/each}
              </span>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  {/each}
</div>

<style>
  .year-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  .year-label {
    font-size: 17px;
    font-weight: 700;
  }
  .year-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border: none;
    background: transparent;
    color: var(--ink-soft);
    border-radius: 999px;
    cursor: pointer;
  }
  .year-btn:active {
    background: var(--line);
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    margin-bottom: 14px;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: var(--ink-soft);
  }
  .legend-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .months-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  @media (min-width: 640px) {
    .months-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  .month {
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 8px;
  }
  .month-name {
    font-size: 12px;
    font-weight: 600;
    text-align: center;
    text-transform: capitalize;
    margin: 0 0 6px;
  }
  .weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    font-size: 8px;
    color: var(--ink-faint);
    text-transform: uppercase;
    margin-bottom: 2px;
  }
  .days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
  }
  .day {
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: var(--ink);
    font-size: 9px;
    font-family: inherit;
    border-radius: 4px;
    cursor: pointer;
    padding: 0;
  }
  .day.empty {
    cursor: default;
  }
  .day.today .day-num {
    font-weight: 700;
    color: var(--blue-deep);
  }
  .day.selected {
    background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
  }
  .day.selected .day-num {
    color: #fff !important;
  }
  .dots {
    display: flex;
    gap: 1px;
    margin-top: 1px;
  }
  .dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
  }
</style>
