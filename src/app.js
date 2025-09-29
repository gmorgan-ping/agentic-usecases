// Interactive Demo Application
class InteractiveDemo {
  constructor() {
    this.currentScenario = null;
    this.currentStep = 0;
    this.scenarios = new Map();
    this.isPlaying = false;
    this.currentMode = 'overview'; // 'overview', 'executive', 'sequence'
    this.animationInProgress = false;
    this.animationQueue = [];

    this.init();
  }

  async init() {
    this.bindEvents();
    await this.loadScenarios();
    this.setupUI();
  }

  bindEvents() {
    // Helper function to safely bind events
    const bindEvent = (id, event, handler) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener(event, handler);
      } else {
        console.warn(`Element with id '${id}' not found, skipping event binding`);
      }
    };

    // Scenario selector
    bindEvent('scenarioSelector', 'change', (e) => {
      this.loadScenario(e.target.value);
    });

    // Navigation buttons
    bindEvent('nextBtn', 'click', () => {
      if (this.animationInProgress) {
        this.skipAnimation();
      }
      this.nextStep();
    });

    bindEvent('prevBtn', 'click', () => {
      if (this.animationInProgress) {
        this.skipAnimation();
      }
      this.prevStep();
    });

    // Mode buttons removed - now using integrated Step 0 approach

    // Note: startWalkthroughBtn removed - overview is now Step 0 in timeline

    // Glossary panel
    bindEvent('closeGlossary', 'click', () => {
      this.hideGlossary();
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this.currentScenario) return;

      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        if (this.animationInProgress) {
          this.skipAnimation();
        }
        this.nextStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (this.animationInProgress) {
          this.skipAnimation();
        }
        this.prevStep();
      } else if (e.key === 'Escape') {
        this.hideGlossary();
      }
    });
  }

  async loadScenarios() {
    try {
      // Load the claims scenario
      const response = await fetch('../src/scenarios/claims.json');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const claimsScenario = await response.json();
      this.scenarios.set('claims', claimsScenario);

      // Wait a bit to ensure DOM is ready
      setTimeout(() => {
        this.populateScenarioDropdown(claimsScenario);
      }, 100);

    } catch (error) {
      console.error('Failed to load scenarios:', error);
      this.showError('Failed to load scenarios: ' + error.message);
    }
  }

  populateScenarioDropdown(claimsScenario) {
    const selector = document.getElementById('scenarioSelector');
    
    if (!selector) {
      console.error('Scenario selector not found');
      return;
    }

    // Ensure we have the default option
    if (selector.options.length === 0 || selector.options[0].value !== '') {
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = 'Select Scenario...';
      selector.insertBefore(defaultOption, selector.firstChild);
    }

    // Add the claims scenario option
    const option = document.createElement('option');
    option.value = 'claims';
    option.textContent = claimsScenario.meta.title;
    selector.appendChild(option);
  }

  setupUI() {
    this.updateNavigationButtons();
    this.renderWelcomeState();
  }

  loadScenario(scenarioId) {
    if (!scenarioId || !this.scenarios.has(scenarioId)) {
      this.currentScenario = null;
      this.currentStep = 0;
      this.currentMode = 'executive';
      this.renderWelcomeState();
      this.updateNavigationButtons();
      return;
    }

    this.currentScenario = this.scenarios.get(scenarioId);
    this.currentStep = 0; // Start with Step 0 (Overview)
    this.currentMode = 'executive';

    this.startExecutiveMode();
  }

  startExecutiveMode() {
    this.currentMode = 'executive';

    // Show main content in executive mode
    document.getElementById('mainContent').style.display = 'flex';
    document.getElementById('executiveMode').style.display = 'contents';
    document.getElementById('sequenceMode').style.display = 'none';

    // Show navigation buttons
    document.getElementById('prevBtn').style.display = 'inline-block';
    document.getElementById('nextBtn').style.display = 'inline-block';

    this.renderProgressiveBreadcrumb();
    this.renderChat();
    this.renderCurrentActivity();
    this.updateNavigationButtons();
  }

  // switchToOverview method removed - overview is now integrated as Step 0

  switchToSequence() {
    this.currentMode = 'sequence';

    // Show sequence mode
    document.getElementById('mainContent').style.display = 'flex';
    document.getElementById('executiveMode').style.display = 'none';
    document.getElementById('sequenceMode').style.display = 'block';

    // Hide navigation buttons in sequence mode
    document.getElementById('prevBtn').style.display = 'none';
    document.getElementById('nextBtn').style.display = 'none';

    this.renderFullBreadcrumb();
    this.renderSequenceView();
  }

  nextStep() {
    if (!this.currentScenario || this.currentStep >= this.currentScenario.timeline.length - 1 || this.currentMode !== 'executive') {
      return;
    }

    this.currentStep++;
    this.renderProgressiveBreadcrumb();
    this.renderChat();
    this.renderCurrentActivity();
    this.updateNavigationButtons();
  }

  prevStep() {
    if (!this.currentScenario || this.currentStep <= 0 || this.currentMode !== 'executive') {
      return;
    }

    this.currentStep--;
    this.renderProgressiveBreadcrumb();
    this.renderChat();
    this.renderCurrentActivity();
    this.updateNavigationButtons();
  }

  // Animation utility methods
  async animateElement(element, animationClass) {
    return new Promise((resolve) => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
      element.classList.add(animationClass);

      setTimeout(() => {
        element.classList.remove(animationClass);
        resolve();
      }, 400);
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  skipAnimation() {
    if (!this.animationInProgress) return;

    this.animationInProgress = false;

    // Complete any pending animations immediately
    const container = document.getElementById('activityContainer').querySelector('.activities-container');
    if (container) {
      const cards = container.querySelectorAll('.activity-card, .activity-arrow');
      cards.forEach(card => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
        card.classList.remove('fadeInUp', 'fadeInDown');
      });
    }
  }

  animateStepTransition(direction) {
    // Animate both panels
    const chatContainer = document.getElementById('chatContainer');
    const swimlaneContainer = document.getElementById('swimlaneContainer');

    const translateValue = direction === 'forward' ? '10px' : '-10px';

    [chatContainer, swimlaneContainer].forEach(container => {
      container.style.transition = 'all 0.3s ease';
      container.style.opacity = '0.7';
      container.style.transform = `translateX(${translateValue})`;
    });

    setTimeout(() => {
      [chatContainer, swimlaneContainer].forEach(container => {
        container.style.opacity = '1';
        container.style.transform = 'translateX(0)';
      });
    }, 150);
  }

  jumpToPhase(phaseId) {
    if (!this.currentScenario || this.currentMode !== 'executive') return;

    // Find the first step of the target phase
    const targetStep = this.currentScenario.timeline.findIndex(step => step.phase === phaseId);
    if (targetStep !== -1) {
      this.currentStep = targetStep;
      this.renderProgressiveBreadcrumb();
      this.renderChat();
      this.renderCurrentActivity();
      this.updateNavigationButtons();
      this.scrollToCurrentStep();
    }
  }

  jumpToPhaseInSequence(phaseId) {
    if (!this.currentScenario || this.currentMode !== 'sequence') return;

    // In sequence mode, just highlight the phase steps
    const table = document.querySelector('.sequence-table');
    if (table) {
      const rows = table.querySelectorAll('tbody tr');
      rows.forEach((row, index) => {
        const step = this.currentScenario.timeline[index];
        if (step && step.phase === phaseId) {
          row.classList.add('highlight-phase');
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          row.classList.remove('highlight-phase');
        }
      });
    }
  }

  scrollToCurrentStep() {
    const chatContainer = document.getElementById('chatContainer');
    const lastMessage = chatContainer.querySelector('.chat-message:last-child');
    if (lastMessage) {
      lastMessage.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }

  renderWelcomeState() {
    // Show welcome messages
    document.getElementById('welcomeMessage').style.display = 'block';
    const welcomeActivity = document.getElementById('welcomeActivity');
    if (welcomeActivity) {
      welcomeActivity.style.display = 'block';
    }

    // Show main content in executive mode
    document.getElementById('mainContent').style.display = 'flex';
    document.getElementById('executiveMode').style.display = 'contents';
    document.getElementById('sequenceMode').style.display = 'none';

    document.getElementById('breadcrumb').innerHTML = '';

    // Clear any existing content
    const chatContainer = document.getElementById('chatContainer');
    const activityContainer = document.getElementById('activityContainer');

    chatContainer.querySelectorAll('.chat-message').forEach(el => el.remove());
    if (activityContainer) {
      activityContainer.querySelectorAll('.activity-card, .activity-arrow, .current-phase-info').forEach(el => el.remove());
    }
  }

  renderProgressiveBreadcrumb() {
    if (!this.currentScenario) return;

    const breadcrumb = document.getElementById('breadcrumb');
    breadcrumb.innerHTML = '';

    // Get all phases that have been reached so far
    const reachedPhases = new Set();
    for (let i = 0; i <= this.currentStep; i++) {
      const step = this.currentScenario.timeline[i];
      if (step && step.phase) {
        reachedPhases.add(step.phase);
      }
    }

    const currentPhase = this.currentScenario.timeline[this.currentStep]?.phase;

    this.currentScenario.phases.forEach((phase) => {
      if (reachedPhases.has(phase.id)) {
        const li = document.createElement('li');
        li.className = 'breadcrumb-item';

        if (phase.id === currentPhase) {
          li.classList.add('active');
          li.textContent = phase.name;
        } else {
          const link = document.createElement('a');
          link.textContent = phase.name;
          link.title = phase.description;
          link.addEventListener('click', () => this.jumpToPhase(phase.id));
          li.appendChild(link);
        }

        breadcrumb.appendChild(li);
      }
    });
  }

  renderFullBreadcrumb() {
    if (!this.currentScenario) return;

    const breadcrumb = document.getElementById('breadcrumb');
    breadcrumb.innerHTML = '';

    this.currentScenario.phases.forEach((phase) => {
      const li = document.createElement('li');
      li.className = 'breadcrumb-item';

      const link = document.createElement('a');
      link.textContent = phase.name;
      link.title = phase.description;
      link.addEventListener('click', () => this.jumpToPhaseInSequence(phase.id));
      li.appendChild(link);

      breadcrumb.appendChild(li);
    });
  }

  renderChat() {
    if (!this.currentScenario) return;

    document.getElementById('welcomeMessage').style.display = 'none';
    const chatContainer = document.getElementById('chatContainer');

    // Clear existing messages
    chatContainer.querySelectorAll('.chat-message').forEach(el => el.remove());

    // Render messages up to current step
    for (let i = 0; i <= this.currentStep; i++) {
      const step = this.currentScenario.timeline[i];
      if (!step || !step.chat) continue;

      const messageEl = this.createChatMessage(step.chat, i + 1);
      chatContainer.appendChild(messageEl);
    }

    // Scroll to bottom
    setTimeout(() => {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 100);
  }

  createChatMessage(chat, stepNumber) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${chat.actor.toLowerCase()}`;

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'chat-avatar';
    avatarDiv.textContent = this.getActorInitials(chat.actor);

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'chat-bubble';

    // Process message content for glossary terms
    const processedMessage = this.processGlossaryTerms(chat.message);
    bubbleDiv.innerHTML = this.formatMessage(processedMessage);

    const timestampDiv = document.createElement('div');
    timestampDiv.className = 'chat-timestamp';
    timestampDiv.textContent = `Step ${stepNumber}`;

    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(bubbleDiv);
    messageDiv.appendChild(timestampDiv);

    // Add step indicator
    const stepIndicator = document.createElement('div');
    stepIndicator.className = 'step-indicator';
    stepIndicator.textContent = stepNumber;
    messageDiv.style.position = 'relative';
    messageDiv.appendChild(stepIndicator);

    return messageDiv;
  }

  renderCurrentActivity() {
    if (!this.currentScenario) return;

    document.getElementById('welcomeActivity').style.display = 'none';
    const activityContainer = document.getElementById('activityContainer');

    // Clear existing activities
    activityContainer.querySelectorAll('.activity-card, .activity-arrow, .current-phase-info').forEach(el => el.remove());

    const currentStepData = this.currentScenario.timeline[this.currentStep];
    if (!currentStepData || !currentStepData.swimlane) return;

    const { activeActors, actions } = currentStepData.swimlane;

    // Create activities container - focus only on actor cards
    const activitiesContainer = document.createElement('div');
    activitiesContainer.className = 'activities-container mt-3';
    activityContainer.appendChild(activitiesContainer);

    // Animate actors sequentially
    this.animateActorsSequentially(activitiesContainer, activeActors, actions);
  }

  async animateActorsSequentially(container, activeActors, actions) {
    this.animationInProgress = true;

    for (let i = 0; i < activeActors.length; i++) {
      const actorId = activeActors[i];
      const actor = this.currentScenario.actors.find(a => a.id === actorId);
      if (!actor) continue;

      // Create actor card
      const actorCard = this.createActivityCard(actor, actorId, actions[actorId]);
      actorCard.style.opacity = '0';
      actorCard.style.transform = 'translateY(20px)';
      container.appendChild(actorCard);

      // Animate card in
      await this.animateElement(actorCard, 'fadeInUp');

      // Add arrow if not the last actor
      if (i < activeActors.length - 1) {
        const arrow = document.createElement('div');
        arrow.className = 'activity-arrow';
        arrow.innerHTML = '<i class="bi bi-arrow-down"></i>';
        arrow.style.opacity = '0';
        container.appendChild(arrow);

        // Animate arrow
        await this.animateElement(arrow, 'fadeInDown');
      }

      // Wait between actors
      if (i < activeActors.length - 1) {
        await this.delay(300);
      }
    }

    this.animationInProgress = false;
  }

  createActivityCard(actor, actorId, action) {
    const actorDiv = document.createElement('div');
    actorDiv.className = 'activity-card card mb-3';
    actorDiv.dataset.actorId = actorId;

    actorDiv.innerHTML = `
      <div class="card-body">
        <div class="d-flex align-items-center mb-2">
          <div class="actor-avatar me-3" style="background-color: ${actor.color}">
            ${this.getActorInitials(actor.name)}
          </div>
          <div>
            <h6 class="card-title mb-0">${actor.name}</h6>
            <small class="text-muted">${actorId}</small>
          </div>
        </div>
        <p class="card-text">${action || 'Standing by...'}</p>
      </div>
    `;

    return actorDiv;
  }

  renderSequenceView() {
    if (!this.currentScenario) return;

    const sequenceContainer = document.getElementById('sequenceContainer');
    sequenceContainer.innerHTML = '';

    // Create sequence table
    const table = document.createElement('table');
    table.className = 'table table-bordered sequence-table';

    // Create header with actors
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th class="step-header">Step</th>';

    this.currentScenario.actors.forEach(actor => {
      const th = document.createElement('th');
      th.className = 'actor-header';
      th.style.color = actor.color;
      th.textContent = actor.name;
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create body with timeline steps
    const tbody = document.createElement('tbody');

    this.currentScenario.timeline.forEach((step, index) => {
      const row = document.createElement('tr');
      row.className = index === this.currentStep ? 'current-step' : '';

      // Step number cell
      const stepCell = document.createElement('td');
      stepCell.className = 'step-cell';
      stepCell.textContent = step.step;
      row.appendChild(stepCell);

      // Actor cells
      this.currentScenario.actors.forEach(actor => {
        const cell = document.createElement('td');
        cell.className = 'actor-cell';

        if (step.swimlane && step.swimlane.activeActors.includes(actor.id)) {
          cell.classList.add('active');
          cell.textContent = step.swimlane.actions[actor.id] || '•';
        }

        row.appendChild(cell);
      });

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    sequenceContainer.appendChild(table);
  }

  updateSwimlaneStates() {
    if (!this.currentScenario) return;

    const currentStepData = this.currentScenario.timeline[this.currentStep];
    if (!currentStepData || !currentStepData.swimlane) return;

    // Reset all actors to inactive state
    document.querySelectorAll('.swimlane-actor').forEach(actor => {
      actor.classList.remove('active', 'highlighted');
      const actionDiv = actor.querySelector('.actor-action');
      actionDiv.textContent = '';
    });

    // Highlight active actors and show their actions
    const { activeActors, actions } = currentStepData.swimlane;

    activeActors.forEach(actorId => {
      const actorEl = document.querySelector(`[data-actor-id="${actorId}"]`);
      if (actorEl) {
        actorEl.classList.add('active');
        const actionDiv = actorEl.querySelector('.actor-action');
        actionDiv.textContent = actions[actorId] || '';
      }
    });

    // Show actions for all actors in previous steps (as highlighted but not active)
    for (let i = 0; i < this.currentStep; i++) {
      const stepData = this.currentScenario.timeline[i];
      if (!stepData.swimlane) continue;

      stepData.swimlane.activeActors.forEach(actorId => {
        const actorEl = document.querySelector(`[data-actor-id="${actorId}"]`);
        if (actorEl && !activeActors.includes(actorId)) {
          actorEl.classList.add('highlighted');
        }
      });
    }
  }

  updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (!this.currentScenario) {
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      return;
    }

    prevBtn.disabled = this.currentStep <= 0;
    nextBtn.disabled = this.currentStep >= this.currentScenario.timeline.length - 1;
  }

  getActorInitials(actorName) {
    if (actorName === 'system') return '⚙️';
    return actorName.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  }

  formatMessage(message) {
    // Convert markdown-style formatting
    return message
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  processGlossaryTerms(message) {
    if (!this.currentScenario || !this.currentScenario.glossary) {
      return message;
    }

    let processedMessage = message;
    Object.keys(this.currentScenario.glossary).forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      processedMessage = processedMessage.replace(regex, (match) => {
        return `<span class="glossary-term" data-term="${term}">${match}</span>`;
      });
    });

    return processedMessage;
  }

  showGlossary(term) {
    if (!this.currentScenario || !this.currentScenario.glossary[term]) return;

    const panel = document.getElementById('glossaryPanel');
    const content = document.getElementById('glossaryContent');

    content.innerHTML = `
            <div class="glossary-definition">
                <strong>${term}</strong>
                <p>${this.currentScenario.glossary[term]}</p>
            </div>
        `;

    panel.style.display = 'block';
  }

  hideGlossary() {
    document.getElementById('glossaryPanel').style.display = 'none';
  }

  showError(message) {
    console.error(message);
    // You could implement a more sophisticated error display here
    alert(message);
  }
}

// Event delegation for glossary terms
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('glossary-term')) {
    const term = e.target.dataset.term;
    if (window.demo) {
      window.demo.showGlossary(term);
    }
  }
});

// Initialize the demo when the page loads
document.addEventListener('DOMContentLoaded', () => {
  window.demo = new InteractiveDemo();
});

// Add some utility functions for potential future use
const utils = {
  // Format timestamps
  formatTime: (date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  },

  // Debounce function for performance
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Smooth scroll to element
  scrollToElement: (element, offset = 0) => {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
};

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { InteractiveDemo, utils };
}