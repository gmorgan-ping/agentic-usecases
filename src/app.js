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
    this.renderedUntilStep = -1; // Track rendered chat messages
    this.navigationDebounceTimer = null;
    this.scrollRequest = null;

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

    // Mode toggle buttons
    bindEvent('executiveBtn', 'click', () => {
      this.switchToExecutive();
    });

    bindEvent('sequenceBtn', 'click', () => {
      this.switchToSequence();
    });

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
    this.renderedUntilStep = -1; // Reset for new scenario

    // Update button states to show Executive as active
    document.getElementById('executiveBtn').classList.add('active');
    document.getElementById('executiveBtn').classList.remove('btn-outline-light');
    document.getElementById('executiveBtn').classList.add('btn-light');
    document.getElementById('sequenceBtn').classList.remove('active');
    document.getElementById('sequenceBtn').classList.remove('btn-light');
    document.getElementById('sequenceBtn').classList.add('btn-outline-light');

    // Show main content in executive mode
    document.getElementById('mainContent').style.display = 'flex';
    document.getElementById('executiveMode').style.display = 'contents';
    document.getElementById('sequenceMode').style.display = 'none';
    document.getElementById('navigationControls').style.display = 'block';

    // Show navigation buttons
    document.getElementById('prevBtn').style.display = 'inline-block';
    document.getElementById('nextBtn').style.display = 'inline-block';

    this.renderProgressiveBreadcrumb();
    this.renderChat(true); // Force rebuild for new scenario
    this.renderCurrentActivity();
    this.updateNavigationButtons();
  }

  switchToExecutive() {
    if (this.currentMode === 'executive') return;

    // Complete any in-flight animations
    if (this.animationInProgress) {
      this.skipAnimation();
    }

    this.currentMode = 'executive';

    // Update button states
    document.getElementById('executiveBtn').classList.add('active');
    document.getElementById('executiveBtn').classList.remove('btn-outline-light');
    document.getElementById('executiveBtn').classList.add('btn-light');
    document.getElementById('sequenceBtn').classList.remove('active');
    document.getElementById('sequenceBtn').classList.remove('btn-light');
    document.getElementById('sequenceBtn').classList.add('btn-outline-light');

    // Cross-fade transition
    this.transitionToMode(() => {
      document.getElementById('executiveMode').style.display = 'contents';
      document.getElementById('sequenceMode').style.display = 'none';
      document.getElementById('navigationControls').style.display = 'block';

      this.renderProgressiveBreadcrumb();
      this.renderChat(); // Preserve chat history
      this.renderCurrentActivity();
      this.updateNavigationButtons();
    });
  }

  switchToSequence() {
    if (this.currentMode === 'sequence') return;

    // Complete any in-flight animations
    if (this.animationInProgress) {
      this.skipAnimation();
    }

    this.currentMode = 'sequence';

    // Update button states
    document.getElementById('sequenceBtn').classList.add('active');
    document.getElementById('sequenceBtn').classList.remove('btn-outline-light');
    document.getElementById('sequenceBtn').classList.add('btn-light');
    document.getElementById('executiveBtn').classList.remove('active');
    document.getElementById('executiveBtn').classList.remove('btn-light');
    document.getElementById('executiveBtn').classList.add('btn-outline-light');

    // Cross-fade transition
    this.transitionToMode(() => {
      document.getElementById('executiveMode').style.display = 'none';
      document.getElementById('sequenceMode').style.display = 'block';
      document.getElementById('navigationControls').style.display = 'none';

      this.renderFullBreadcrumb();
      this.renderEnhancedSequenceView();
    });
  }

  nextStep() {
    if (!this.currentScenario || this.currentStep >= this.currentScenario.timeline.length - 1 || this.currentMode !== 'executive') {
      return;
    }

    this.debouncedNavigation(() => {
      // Cancel any in-flight animations
      if (this.animationInProgress) {
        this.skipAnimation();
      }

      this.currentStep++;
      this.renderProgressiveBreadcrumb();
      this.renderChat(); // Incremental render
      this.renderCurrentActivity();
      this.updateNavigationButtons();
    });
  }

  prevStep() {
    if (!this.currentScenario || this.currentStep <= 0 || this.currentMode !== 'executive') {
      return;
    }

    this.debouncedNavigation(() => {
      // Cancel any in-flight animations
      if (this.animationInProgress) {
        this.skipAnimation();
      }

      this.currentStep--;
      this.renderProgressiveBreadcrumb();
      this.renderChat(true); // Force rebuild for backward navigation
      this.renderCurrentActivity();
      this.updateNavigationButtons();
    });
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
      // Cancel any in-flight animations
      if (this.animationInProgress) {
        this.skipAnimation();
      }

      this.currentStep = targetStep;
      this.renderProgressiveBreadcrumb();
      this.renderChat(true); // Force rebuild for jumps
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

    // In executive mode, show only reached phases; in sequence mode, show all
    const showAllPhases = this.currentMode === 'sequence';
    const reachedPhases = new Set();

    if (!showAllPhases) {
      for (let i = 0; i <= this.currentStep; i++) {
        const step = this.currentScenario.timeline[i];
        if (step && step.phase) {
          reachedPhases.add(step.phase);
        }
      }
    }

    const currentPhase = this.currentScenario.timeline[this.currentStep]?.phase;

    this.currentScenario.phases.forEach((phase) => {
      if (showAllPhases || reachedPhases.has(phase.id)) {
        const li = document.createElement('li');
        li.className = 'breadcrumb-item';

        if (phase.id === currentPhase) {
          li.classList.add('active');
          li.textContent = phase.name;
        } else {
          const link = document.createElement('a');
          link.textContent = phase.name;
          link.title = phase.description;
          link.addEventListener('click', () => {
            if (this.currentMode === 'sequence') {
              this.scrollToPhaseInSequence(phase.id);
            } else {
              this.jumpToPhase(phase.id);
            }
          });
          li.appendChild(link);
        }

        breadcrumb.appendChild(li);
      }
    });
  }

  renderFullBreadcrumb() {
    // Use the same logic as progressive breadcrumb
    this.renderProgressiveBreadcrumb();
  }

  renderChat(forceRebuild = false) {
    if (!this.currentScenario) return;

    document.getElementById('welcomeMessage').style.display = 'none';
    const chatContainer = document.getElementById('chatContainer');

    // Check if we need to detect scroll position before changes
    const isNearBottom = this.isNearBottom(chatContainer);

    if (forceRebuild || this.currentStep < this.renderedUntilStep) {
      // Full rebuild needed for backward navigation or jumps
      chatContainer.querySelectorAll('.chat-message').forEach(el => el.remove());
      this.renderedUntilStep = -1;
    }

    // Render only new messages from renderedUntilStep+1 to currentStep
    for (let i = this.renderedUntilStep + 1; i <= this.currentStep; i++) {
      const step = this.currentScenario.timeline[i];
      if (!step || !step.chat) continue;

      // Check if message already exists
      if (chatContainer.querySelector(`[data-step="${i + 1}"]`)) continue;

      const messageEl = this.createChatMessage(step.chat, i + 1);
      chatContainer.appendChild(messageEl);
    }

    this.renderedUntilStep = Math.max(this.renderedUntilStep, this.currentStep);

    // Smart scroll: only scroll if user was near bottom
    if (isNearBottom) {
      this.scrollToBottom(chatContainer);
    }
  }

  createChatMessage(chat, stepNumber) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${chat.actor.toLowerCase()}`;
    messageDiv.setAttribute('data-step', stepNumber);
    messageDiv.setAttribute('aria-live', 'polite');

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

  // Chat scrolling helper methods
  isNearBottom(container, threshold = 48) {
    return (container.scrollHeight - (container.scrollTop + container.clientHeight)) < threshold;
  }

  scrollToBottom(container) {
    if (this.scrollRequest) {
      cancelAnimationFrame(this.scrollRequest);
    }

    this.scrollRequest = requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
      this.scrollRequest = null;
    });
  }

  debouncedNavigation(callback, delay = 150) {
    if (this.navigationDebounceTimer) {
      clearTimeout(this.navigationDebounceTimer);
    }

    this.navigationDebounceTimer = setTimeout(() => {
      callback();
      this.navigationDebounceTimer = null;
    }, delay);
  }

  transitionToMode(callback) {
    const mainContent = document.getElementById('mainContent');
    mainContent.classList.add('mode-transition');

    setTimeout(() => {
      callback();
      mainContent.classList.add('show');
    }, 150);

    setTimeout(() => {
      mainContent.classList.remove('mode-transition', 'show');
    }, 300);
  }

  renderEnhancedSequenceView() {
    if (!this.currentScenario) return;

    const sequenceContainer = document.getElementById('sequenceContainer');
    sequenceContainer.innerHTML = '';

    // Create sequence table with new layout: actors as columns, steps as rows
    const table = document.createElement('table');
    table.className = 'sequence-diagram';

    // Create sticky header row with actors as columns
    const headerRow = document.createElement('tr');
    headerRow.className = 'actor-header-row';

    // First column: Step/Phase header
    const stepHeader = document.createElement('th');
    stepHeader.className = 'step-phase-header';
    stepHeader.innerHTML = 'Steps';
    headerRow.appendChild(stepHeader);

    // Actor columns in exact order specified
    const actorOrder = ['User', 'Assistant', 'Agent', 'MCP', 'IdP', 'PDP', 'STS', 'API', 'Audit'];
    actorOrder.forEach(actorId => {
      const actor = this.currentScenario.actors.find(a => a.id === actorId);
      if (actor) {
        const th = document.createElement('th');
        th.className = 'actor-column-header';
        th.style.borderTop = `3px solid ${actor.color}`;
        th.innerHTML = `
          <div class="actor-header-content">
            <div class="actor-avatar" style="background-color: ${actor.color};">
              ${this.getActorInitials(actor.name)}
            </div>
            <span class="actor-name">${actor.name}</span>
          </div>
        `;
        headerRow.appendChild(th);
      }
    });
    table.appendChild(headerRow);

    // Create step rows
    this.currentScenario.timeline.forEach((step, stepIndex) => {
      const row = document.createElement('tr');
      row.className = 'step-row';

      // Highlight current step row
      if (stepIndex === this.currentStep) {
        row.classList.add('current-step');
        row.setAttribute('aria-current', 'row');
      }

      // Step/Phase cell (sticky left)
      const stepCell = document.createElement('td');
      stepCell.className = 'step-phase-cell';
      stepCell.innerHTML = `
        <div class="step-info">
          <strong>Step ${stepIndex + 1}</strong>
          <div class="phase-name">${step.phase}</div>
        </div>
      `;
      stepCell.style.cursor = 'pointer';
      stepCell.title = `Click to jump to Step ${stepIndex + 1}`;
      stepCell.addEventListener('click', () => {
        this.jumpToStepFromSequence(stepIndex);
      });
      row.appendChild(stepCell);

      // Actor cells for this step
      actorOrder.forEach(actorId => {
        const actor = this.currentScenario.actors.find(a => a.id === actorId);
        if (actor) {
          const cell = document.createElement('td');
          cell.className = 'actor-step-cell';
          cell.style.cursor = 'pointer';
          cell.addEventListener('click', () => {
            this.jumpToStepFromSequence(stepIndex);
          });

          // Check if actor is active in this step
          if (step.swimlane && step.swimlane.activeActors.includes(actor.id)) {
            cell.classList.add('active');
            const action = step.swimlane.actions[actor.id];

            // Create cell card with content
            const cellCard = document.createElement('div');
            cellCard.className = 'cell-card';
            cellCard.style.borderLeft = `3px solid ${actor.color}`;

            // Simplified text creation - always create text element
            const actionText = document.createElement('div');
            actionText.className = 'action-text';

            if (action && action.trim()) {
              // Use full text for multi-line display
              actionText.textContent = action;
              actionText.title = action; // Keep tooltip for consistency
              console.log(`Adding full text for ${actor.id}:`, action); // Debug
            } else {
              actionText.textContent = 'Active';
              actionText.style.fontStyle = 'italic';
              console.log(`Adding fallback text for ${actor.id}`); // Debug
            }

            // Let CSS handle the styling

            cellCard.appendChild(actionText);

            // Add badges for special attributes
            this.addSequenceBadges(cellCard, step, actor.id);

            cell.appendChild(cellCard);
          }

          // Always append the cell to the row, whether active or not
          row.appendChild(cell);
        }
      });

      // Add arrows for hand-offs if multiple actors are active
      if (step.swimlane && step.swimlane.activeActors.length > 1) {
        this.addHandoffArrows(row, step.swimlane.activeActors, actorOrder);
      }

      table.appendChild(row);
    });

    sequenceContainer.appendChild(table);

    // Add legend
    this.addSequenceLegend(sequenceContainer);

    // Initialize Bootstrap tooltips
    this.initializeTooltips();

    // Auto-scroll to current step row
    this.scrollToCurrentStepRow();
  }

  initializeTooltips() {
    // Initialize Bootstrap tooltips for action text
    const tooltipElements = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipElements.forEach(element => {
      if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        new bootstrap.Tooltip(element);
      }
    });
  }

  addSequenceBadges(cell, step, actorId) {
    // Add policy decision badges
    if (step.policy && step.policy.decision) {
      const badge = document.createElement('span');
      badge.className = 'action-badge';
      badge.textContent = step.policy.decision;
      badge.style.backgroundColor = step.policy.decision === 'Permit' ? '#28a745' :
        step.policy.decision === 'Step-up' ? '#ffc107' : '#dc3545';
      cell.appendChild(badge);
    }

    // Add token badges
    if (step.token && step.token.type) {
      const badge = document.createElement('span');
      badge.className = 'action-badge';
      badge.textContent = `${step.token.type}${step.token.holder ? ' → ' + step.token.holder : ''}`;
      badge.style.backgroundColor = '#17a2b8';
      cell.appendChild(badge);
    }

    // Add handle badges
    if (step.handle && step.handle.id) {
      const badge = document.createElement('span');
      badge.className = 'action-badge';
      badge.textContent = 'Handle';
      badge.style.backgroundColor = '#6f42c1';
      cell.appendChild(badge);
    }
  }

  addSequenceLegend(container) {
    const legend = document.createElement('div');
    legend.className = 'sequence-legend';
    legend.innerHTML = `
      <div class="legend-title">Badges</div>
      <div class="legend-item">
        <span class="legend-badge" style="background-color: #28a745;">Permit</span>
        <span class="legend-badge" style="background-color: #ffc107; color: #000;">Step-up</span>
        <span class="legend-badge" style="background-color: #dc3545;">Deny</span>
      </div>
      <div class="legend-item">
        <span class="legend-badge" style="background-color: #17a2b8;">OBO→MCP</span>
        <span class="legend-badge" style="background-color: #6f42c1;">Handle</span>
      </div>
    `;
    container.appendChild(legend);
  }

  jumpToStepFromSequence(stepIndex) {
    this.currentStep = stepIndex;
    this.switchToExecutive();
  }

  scrollToPhaseInSequence(phaseId) {
    if (this.currentMode !== 'sequence') return;

    // Find first step of the target phase
    const targetStepIndex = this.currentScenario.timeline.findIndex(step => step.phase === phaseId);
    if (targetStepIndex !== -1) {
      const targetRow = document.querySelectorAll('.step-row')[targetStepIndex];
      if (targetRow) {
        targetRow.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
    }
  }

  addHandoffArrows(row, activeActors, actorOrder) {
    // Create connecting arrows between active actor cells
    row.style.position = 'relative';

    for (let i = 0; i < activeActors.length - 1; i++) {
      const fromActorId = activeActors[i];
      const toActorId = activeActors[i + 1];

      const fromIndex = actorOrder.indexOf(fromActorId);
      const toIndex = actorOrder.indexOf(toActorId);

      if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
        // Create arrow overlay div
        const arrowDiv = document.createElement('div');
        arrowDiv.className = 'handoff-arrow-overlay';
        arrowDiv.innerHTML = '→';
        arrowDiv.style.position = 'absolute';
        arrowDiv.style.color = '#007bff';
        arrowDiv.style.fontWeight = 'bold';
        arrowDiv.style.fontSize = '1.2rem';
        arrowDiv.style.zIndex = '5';
        arrowDiv.style.pointerEvents = 'none';
        arrowDiv.style.top = '50%';
        arrowDiv.style.transform = 'translateY(-50%)';

        // Calculate position based on cell indices (accounting for step column)
        const cellWidth = 100 / (actorOrder.length + 1); // +1 for step column
        const fromLeft = (fromIndex + 1) * cellWidth + cellWidth / 2;
        const toLeft = (toIndex + 1) * cellWidth;

        arrowDiv.style.left = `${fromLeft + 2}%`;
        arrowDiv.style.width = `${Math.abs(toLeft - fromLeft) - 4}%`;
        arrowDiv.style.textAlign = 'center';

        row.appendChild(arrowDiv);
      }
    }
  }

  scrollToCurrentStepRow() {
    if (this.currentMode !== 'sequence') return;

    const currentRow = document.querySelector('.step-row.current-step');
    if (currentRow) {
      currentRow.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
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