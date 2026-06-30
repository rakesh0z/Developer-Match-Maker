import './App.css'
import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom'
import Dashboard from './Dashboard'
import IssuesDashboard from './IssuesDashboard'
import { api, type UserProfile, type UserProfileUpdate } from './api'

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/issues', label: 'Issue Explorer' }
]

function AppShell({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [profileForm, setProfileForm] = useState<UserProfileUpdate>({ username: '', avatarUrl: '', bio: '' })
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  const initials = useMemo(() => {
    const value = profile?.username?.trim() || 'D'
    return value.slice(0, 1).toUpperCase()
  }, [profile])

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoadingProfile(true)
        const response = await api.get<UserProfile>('/auth/me')
        setProfile(response.data)
        setProfileForm({
          username: response.data.username ?? '',
          avatarUrl: response.data.avatarUrl ?? '',
          bio: response.data.bio ?? ''
        })
      } catch (error: any) {
        setProfileError(error?.response?.data?.error || error?.message || 'Failed to load profile')
      } finally {
        setLoadingProfile(false)
      }
    }

    loadProfile()
  }, [])

  const saveProfile = async () => {
    try {
      setSavingProfile(true)
      setProfileError(null)

      const response = await api.put<UserProfile>('/users/profile', profileForm)
      setProfile(response.data)
      setProfileForm({
        username: response.data.username ?? '',
        avatarUrl: response.data.avatarUrl ?? '',
        bio: response.data.bio ?? ''
      })
      setIsProfileOpen(false)
    } catch (error: any) {
      setProfileError(error?.response?.data?.error || error?.message || 'Failed to save profile')
    } finally {
      setSavingProfile(false)
    }
  }

  return (
    <div className='app-shell'>
      <header className='app-header'>
        <div>
          <p className='eyebrow'>OpenSource Matchmaker</p>
          <h2 style={{ margin: 0 }}>Find the right open-source issue for your skills.</h2>
        </div>

        <nav className='app-nav' aria-label='Primary'>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'nav-link nav-link--active' : 'nav-link')}
            >
              {item.label}
            </NavLink>
          ))}

          <button
            className='profile-button'
            type='button'
            onClick={() => setIsProfileOpen(true)}
            aria-label='Open user profile'
            title='User profile'
          >
            <span className='profile-button__avatar'>{loadingProfile ? '…' : initials}</span>
            <span className='profile-button__text'>
              <strong>{profile?.username ?? 'Profile'}</strong>
              <small>View and edit</small>
            </span>
          </button>
        </nav>
      </header>

      <main className='app-main'>{children}</main>

      {isProfileOpen && (
        <div className='profile-modal-backdrop' role='presentation' onClick={() => setIsProfileOpen(false)}>
          <section className='panel profile-modal' role='dialog' aria-modal='true' aria-labelledby='profile-modal-title' onClick={(event) => event.stopPropagation()}>
            <div className='section-heading section-heading--tight'>
              <div>
                <p className='eyebrow'>User profile</p>
                <h2 id='profile-modal-title'>Edit your profile</h2>
              </div>
              <button className='button button--ghost' type='button' onClick={() => setIsProfileOpen(false)}>
                Close
              </button>
            </div>

            <p className='section-note'>This saves directly into your PostgreSQL user record.</p>

            <div className='profile-form'>
              <label className='filter-field'>
                <span>Username</span>
                <input
                  value={profileForm.username}
                  onChange={(event) => setProfileForm((current) => ({ ...current, username: event.target.value }))}
                  placeholder='Your display name'
                />
              </label>

              <label className='filter-field'>
                <span>Avatar URL</span>
                <input
                  value={profileForm.avatarUrl}
                  onChange={(event) => setProfileForm((current) => ({ ...current, avatarUrl: event.target.value }))}
                  placeholder='https://...'
                />
              </label>

              <label className='filter-field'>
                <span>Bio</span>
                <textarea
                  rows={4}
                  value={profileForm.bio}
                  onChange={(event) => setProfileForm((current) => ({ ...current, bio: event.target.value }))}
                  placeholder='Tell people what you build and what you are learning'
                />
              </label>
            </div>

            {profileError && <p className='error-text'>{profileError}</p>}

            <div className='cta-row'>
              <button className='button button--primary' type='button' onClick={saveProfile} disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save profile'}
              </button>
              <button className='button button--ghost' type='button' onClick={() => setIsProfileOpen(false)}>
                Cancel
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

function Home() {
  return (
    <main className='landing'>
      <section className='hero-grid'>
        <div className='hero-copy panel panel--hero'>
          <p className='eyebrow'>Contribute smarter. Not harder.</p>
          <h1>OpenSource Matchmaker</h1>
          <p className='hero-lead'>
            Stop searching for random issues. Connect your GitHub profile, analyze your stack,
            and get recommendations that explain exactly why they fit.
          </p>

          <div className='cta-row'>
            <a className='button button--primary' href='http://localhost:3000/api/auth/github'>
              Login with GitHub
            </a>
            <a className='button button--ghost' href='/dashboard'>
              Preview the dashboard
            </a>
          </div>

          <div className='hero-badges'>
            <span className='chip'>Skill analysis</span>
            <span className='chip'>Plain-English issue summaries</span>
            <span className='chip'>Beginner-friendly filters</span>
          </div>
        </div>

        <div className='hero-visual panel'>
          <div className='floating-stack floating-stack--left' />
          <div className='floating-stack floating-stack--right' />
          <div className='stack-card stack-card--top'>
            <span>96% Match</span>
            <strong>Fix JWT authentication flow</strong>
            <p>Java • Spring Boot • REST API</p>
          </div>
          <div className='stack-card stack-card--middle'>
            <span>Why this issue?</span>
            <p>Matches Java, beginner-friendly, recently active.</p>
          </div>
          <div className='stack-card stack-card--bottom'>
            <span>Your Developer DNA</span>
            <p>Backend 92% · Frontend 68% · DevOps 18%</p>
          </div>
        </div>
      </section>

      <section className='feature-grid'>
        <article className='panel feature-card'>
          <p className='eyebrow'>The problem</p>
          <h3>GitHub has too many issues and too little guidance.</h3>
          <p>
            Developers spend hours filtering through noise, and beginners often bounce off issues
            that look easy but are actually a poor fit.
          </p>
        </article>

        <article className='panel feature-card'>
          <p className='eyebrow'>The solution</p>
          <h3>Recommend the right issue, not just a popular one.</h3>
          <p>
            The app imports your profile, scores your stack, and surfaces issues with a clear
            explanation of why they match.
          </p>
        </article>

        <article className='panel feature-card'>
          <p className='eyebrow'>The payoff</p>
          <h3>Turn first contributions into a repeatable habit.</h3>
          <p>
            A contributor dashboard, smart filters, and learning-mode prompts make the platform
            useful for students, builders, and recruiters alike.
          </p>
        </article>
      </section>

      <section className='panel roadmap-panel'>
        <div className='section-heading'>
          <div>
            <p className='eyebrow'>Vision</p>
            <h2>What the working product does</h2>
          </div>
          <p className='section-note'>A real MVP built on the current GitHub auth, skills, and recommendations flow.</p>
        </div>

        <div className='roadmap-grid'>
          <div className='roadmap-item'>
            <strong>1. GitHub login</strong>
            <span>Import username, avatar, bio, repos, and languages automatically.</span>
          </div>
          <div className='roadmap-item'>
            <strong>2. Skill analysis</strong>
            <span>Convert repo languages into a developer score and skill graph.</span>
          </div>
          <div className='roadmap-item'>
            <strong>3. Issue matching</strong>
            <span>Rank issues by fit, difficulty, recency, and matching language.</span>
          </div>
          <div className='roadmap-item'>
            <strong>4. Growth loop</strong>
            <span>Track progress, sync skills, and keep recommendations fresh.</span>
          </div>
        </div>
      </section>
    </main>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route
          path='/dashboard'
          element={
            <AppShell>
              <Dashboard />
            </AppShell>
          }
        />
        <Route
          path='/issues'
          element={
            <AppShell>
              <IssuesDashboard />
            </AppShell>
          }
        />
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
