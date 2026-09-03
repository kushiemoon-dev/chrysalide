<script lang="ts">
  import { page } from '$app/state'
  import { goto } from '$app/navigation'
  import { i18n } from '$lib/i18n.svelte'
  import { getPractitioner, updatePractitioner } from '$lib/db'
  import type { AppointmentType } from '$lib/types'
  import PractitionerFormFields from '$lib/components/practitioners/PractitionerFormFields.svelte'
  import ArrowLeft from '@lucide/svelte/icons/arrow-left'

  let loading = $state(true)
  let saving = $state(false)
  let practitionerId = $state<number | null>(null)

  let name = $state('')
  let specialty = $state<AppointmentType>('general')
  let location = $state('')
  let phone = $state('')
  let email = $state('')
  let website = $state('')
  let notes = $state('')
  let isTransFriendly = $state(false)

  async function loadData() {
    const id = parseInt(page.params.id!)
    if (isNaN(id)) {
      await goto('/practitioners')
      return
    }

    const data = await getPractitioner(id)
    if (!data) {
      await goto('/practitioners')
      return
    }

    practitionerId = id
    name = data.name
    specialty = data.specialty
    location = data.location ?? ''
    phone = data.phone ?? ''
    email = data.email ?? ''
    website = data.website ?? ''
    notes = data.notes ?? ''
    isTransFriendly = data.isTransFriendly ?? false
    loading = false
  }

  $effect(() => {
    void page.params.id
    loading = true
    loadData()
  })

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!practitionerId || !name.trim()) return

    saving = true
    try {
      await updatePractitioner(practitionerId, {
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

{#if loading}
  <p class="loading">{i18n.t('appointments.detail.loading')}</p>
{:else}
  <div class="header">
    <a href="/practitioners" class="icon-link" aria-label={i18n.t('common.back')}
      ><ArrowLeft size={20} /></a
    >
    <div>
      <h1>{i18n.t('practitioners.edit.title')}</h1>
      <p class="subtitle">{name}</p>
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
{/if}

<style>
  .loading {
    color: var(--ink-soft);
    text-align: center;
    padding: 40px 0;
  }
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
