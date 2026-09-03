<div class="aurora" aria-hidden="true">
  <span class="a1"></span>
  <span class="a2"></span>
  <span class="a3"></span>
</div>

<style>
  .aurora {
    position: fixed;
    inset: 0;
    overflow: hidden;
    z-index: 0;
    pointer-events: none;
  }
  .aurora span {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    opacity: var(--aurora-opacity);
    mix-blend-mode: var(--aurora-blend);
    will-change: transform;
    transition: opacity 0.3s ease;
  }
  .a1 {
    width: 260px;
    height: 260px;
    background: var(--blue);
    top: -60px;
    left: -60px;
  }
  .a2 {
    width: 280px;
    height: 280px;
    background: var(--pink);
    top: 120px;
    right: -90px;
  }
  .a3 {
    width: 220px;
    height: 220px;
    background: var(--gold);
    bottom: 60px;
    left: -40px;
    opacity: calc(var(--aurora-opacity) - 0.15);
  }
  @media (prefers-reduced-motion: no-preference) {
    .a1 {
      animation: drift1 24s ease-in-out infinite alternate;
    }
    .a2 {
      animation: drift2 30s ease-in-out infinite alternate;
    }
    .a3 {
      animation: drift3 20s ease-in-out infinite alternate;
    }
  }
  @keyframes drift1 {
    from {
      transform: translate(0, 0) scale(1);
    }
    to {
      transform: translate(40px, 50px) scale(1.15);
    }
  }
  @keyframes drift2 {
    from {
      transform: translate(0, 0) scale(1);
    }
    to {
      transform: translate(-50px, -30px) scale(1.1);
    }
  }
  @keyframes drift3 {
    from {
      transform: translate(0, 0) scale(1);
    }
    to {
      transform: translate(30px, -40px) scale(1.2);
    }
  }
</style>
