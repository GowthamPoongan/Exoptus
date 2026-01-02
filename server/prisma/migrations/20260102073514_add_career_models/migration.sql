-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "auth_providers" TEXT NOT NULL DEFAULT 'email',
    "created_with" TEXT NOT NULL DEFAULT 'email',
    "google_id" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "onboarding_step" TEXT,
    "last_completed_step" TEXT,
    "onboarding_completed_at" DATETIME,
    "onboarding_status" TEXT NOT NULL DEFAULT 'not_started',
    "onboarding_data" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "last_login_at" DATETIME,
    "jr_score" REAL DEFAULT 0,
    "jr_score_updated_at" DATETIME
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "device_info" TEXT,
    "ip_address" TEXT,
    CONSTRAINT "auth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT,
    CONSTRAINT "email_verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "onboarding_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT,
    "gender" TEXT,
    "age" INTEGER,
    "state" TEXT,
    "city" TEXT,
    "status" TEXT,
    "college" TEXT,
    "course" TEXT,
    "stream" TEXT,
    "semester" INTEGER,
    "passout_year" INTEGER,
    "cgpa" REAL,
    "subjects" TEXT,
    "resume_url" TEXT,
    "office_id_url" TEXT,
    "career_aspiration" TEXT,
    "selected_role_id" TEXT,
    "selected_role_name" TEXT,
    "expected_salary" TEXT,
    "skill_gap" INTEGER,
    "flow_path" TEXT,
    "completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "onboarding_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT,
    "college" TEXT,
    "course" TEXT,
    "year" INTEGER,
    "phone" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "comment" TEXT,
    "source" TEXT NOT NULL DEFAULT 'dashboard',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "career_analysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "jrScore" REAL NOT NULL DEFAULT 0,
    "skillGap" INTEGER NOT NULL DEFAULT 0,
    "matched_role_ids" TEXT,
    "top_role" TEXT,
    "top_role_match" REAL,
    "growth_matrix" TEXT,
    "estimated_months" INTEGER,
    "acquired_skills" TEXT,
    "missing_skills" TEXT,
    "skills_priority" TEXT,
    "generated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "career_analysis_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "salary_min" REAL,
    "salary_max" REAL,
    "salary_currency" TEXT NOT NULL DEFAULT 'USD',
    "skills_required" TEXT NOT NULL,
    "experience_years" INTEGER,
    "education_level" TEXT,
    "category" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "demandLevel" TEXT NOT NULL DEFAULT 'high',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "company" TEXT NOT NULL,
    "location" TEXT,
    "salary_min" REAL,
    "salary_max" REAL,
    "role_id" TEXT,
    "posted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "jobs_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_session_token_key" ON "auth_sessions"("session_token");

-- CreateIndex
CREATE INDEX "auth_sessions_user_id_idx" ON "auth_sessions"("user_id");

-- CreateIndex
CREATE INDEX "auth_sessions_session_token_idx" ON "auth_sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_token_key" ON "email_verification_tokens"("token");

-- CreateIndex
CREATE INDEX "email_verification_tokens_token_idx" ON "email_verification_tokens"("token");

-- CreateIndex
CREATE INDEX "email_verification_tokens_email_idx" ON "email_verification_tokens"("email");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_profiles_user_id_key" ON "onboarding_profiles"("user_id");

-- CreateIndex
CREATE INDEX "onboarding_profiles_user_id_idx" ON "onboarding_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE INDEX "profiles_user_id_idx" ON "profiles"("user_id");

-- CreateIndex
CREATE INDEX "user_feedback_user_id_idx" ON "user_feedback"("user_id");

-- CreateIndex
CREATE INDEX "user_feedback_created_at_idx" ON "user_feedback"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "career_analysis_user_id_key" ON "career_analysis"("user_id");

-- CreateIndex
CREATE INDEX "career_analysis_user_id_idx" ON "career_analysis"("user_id");

-- CreateIndex
CREATE INDEX "career_analysis_jrScore_idx" ON "career_analysis"("jrScore");

-- CreateIndex
CREATE UNIQUE INDEX "roles_title_key" ON "roles"("title");

-- CreateIndex
CREATE INDEX "roles_category_idx" ON "roles"("category");

-- CreateIndex
CREATE INDEX "roles_difficulty_idx" ON "roles"("difficulty");

-- CreateIndex
CREATE INDEX "jobs_role_id_idx" ON "jobs"("role_id");

-- CreateIndex
CREATE INDEX "jobs_company_idx" ON "jobs"("company");

-- CreateIndex
CREATE INDEX "jobs_posted_at_idx" ON "jobs"("posted_at");
