<script lang="ts">
  import type { Locale } from 'date-fns'
  import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday,
    addMonths,
    subMonths,
  } from 'date-fns'
  import ChevronLeft from '@lucide/svelte/icons/chevron-left'
  import ChevronRight from '@lucide/svelte/icons/chevron-right'

  let {
    currentMonth,
    selectedDate,
    highlighted = [],
    dateLocale,
    onSelectDate,
    onMonthChange,
  }: {
    currentMonth: Date
    selectedDate: Date
    highlighted?: Date[]
    dateLocale: Locale
    onSelectDate: (date: Date) => void
    onMonthChange: (date: Date) => void
  } = $props()

  let days = $derived(
    eachDayOfInterval({
      start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }),
    })
  )

  let weekdayLabels = $derived(
    eachDayOfInterval({
      start: startOfWeek(new Date(), { weekStartsOn: 1 }),
      end: endOfWeek(new Date(), { weekStartsOn: 1 }),
    }).map((d) => format(d, 'EEEEE', { locale: dateLocale }))
  )

  function hasLog(day: Date) {
    return highlighted.some((d) => isSameDay(d, day))
  }
</script>

<div class="calendar">
  <div class="cal-head">
    <button
      type="button"
      class="cal-nav"
      onclick={() => onMonthChange(subMonths(currentMonth, 1))}
      aria-label="←"
    >
      <ChevronLeft size={18} />
    </button>
    <span class="cal-month">{format(currentMonth, 'MMMM yyyy', { locale: dateLocale })}</span>
    <button
      type="button"
      class="cal-nav"
      onclick={() => onMonthChange(addMonths(currentMonth, 1))}
      aria-label="→"
    >
      <ChevronRight size={18} />
    </button>
  </div>
  <div class="cal-weekdays">
    {#each weekdayLabels as label, i (i)}
      <span>{label}</span>
    {/each}
  </div>
  <div class="cal-grid">
    {#each days as day (day.toISOString())}
      <button
        type="button"
        class="cal-day"
        class:outside={!isSameMonth(day, currentMonth)}
        class:today={isToday(day)}
        class:selected={isSameDay(day, selectedDate)}
        class:has-log={hasLog(day)}
        onclick={() => onSelectDate(day)}
      >
        {format(day, 'd')}
      </button>
    {/each}
  </div>
</div>

<style>
  .calendar {
    width: 100%;
  }
  .cal-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  .cal-month {
    font-size: 14px;
    font-weight: 600;
    text-transform: capitalize;
  }
  .cal-nav {
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
  .cal-nav:active {
    background: var(--line);
  }
  .cal-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    font-size: 11px;
    color: var(--ink-faint);
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
  }
  .cal-day {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: var(--ink);
    font-size: 13px;
    font-family: inherit;
    border-radius: 50%;
    cursor: pointer;
    position: relative;
  }
  .cal-day.outside {
    color: var(--ink-faint);
  }
  .cal-day.today {
    font-weight: 700;
  }
  .cal-day.has-log::after {
    content: '';
    position: absolute;
    bottom: 3px;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--blue-deep);
  }
  .cal-day.selected {
    background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
    color: #fff;
  }
  .cal-day.selected.has-log::after {
    background: #fff;
  }
</style>
