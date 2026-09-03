<script lang="ts">
  import { goto } from '$app/navigation'
  import { i18n } from '$lib/i18n.svelte'
  import { addPractitioner } from '$lib/db'
  import type { AppointmentType } from '$lib/types'
  import PractitionerFormFields from '$lib/components/practitioners/PractitionerFormFields.svelte'
  import ArrowLeft from '@lucide/svelte/icons/arrow-left'

  let saving = $state(false)

  let name = $state('')
  let specialty = $state<AppointmentType>('general')
  let location = $state('')
  let phone = $state('')
  let email = $state('')
  let website = $state('')
  let notes = $state('')
  let isTransFriendly = $state(false)

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!name.trim()) return

    saving = true
    try {
      await addPractitioner({
        name: name.trim(),
        specialty,
        location: location.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        website: website.trim() || undefined,
        notes: notes.trim() || undefined,
        isTransFriendly,
      })
      await goto('/practitioners')
    } finally {
      saving = false
    }
  }
</script>

<div class="header">
  <a href="/practitioners" class="icon-link" aria-label={i18n.t('common.back')}
    ><ArrowLeft size={20} /></a
  >
  <div>
    <h1>{i18n.t('practitioners.new.title')}</h1>
    <p class="subtitle">{i18n.t('practitioners.new.subtitle')}</p>
  </div>
</div>

<form onsubmit={handleSubmit}>
  <PractitionerFormFields
    bind:name
    bind:specialty
    bind:location
    bind:phone
    bind:email
    bind:website
    bind:notes
    bind:isTransFriendly
    {saving}
    backHref="/practitioners"
  />
</form>

<style>
  .header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 18px;
  }
  h1 {
    font-size: 19px;
    font-weight: 700;
    margin: 0;
  }
  .subtitle {
    font-size: 12.5px;
    color: var(--ink-soft);
    margin: 2px 0 0;
  }
  .icon-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    color: var(--ink);
    text-decoration: none;
    flex-shrink: 0;
  }
</style>
