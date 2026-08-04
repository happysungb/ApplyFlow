"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type ApplicationStatus =
  | "Interested"
  | "Applied"
  | "Interview"
  | "Rejected"
  | "Offer";

type StatusFilter = "All" | ApplicationStatus;

type InterestedSortOption = "deadline" | "postedDate";

type JobApplication = {
  id: string;
  company: string;
  position: string;
  status: ApplicationStatus;
  resumeId?: string;
  postedDate?: string;
  deadline?: string;
  jobUrl: string;
  note?: string;
};

const STATUS_OPTIONS: ApplicationStatus[] = [
  "Interested",
  "Applied",
  "Interview",
  "Rejected",
  "Offer",
];

function compareOptionalDates(
  firstDate?: string | null,
  secondDate?: string | null,
) {
  if (firstDate && secondDate) {
    return firstDate.localeCompare(secondDate);
  }

  if (firstDate && !secondDate) {
    return -1;
  }

  if (!firstDate && secondDate) {
    return 1;
  }

  return 0;
}

function ExpandableNote({ note }: { note: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const noteRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const noteElement = noteRef.current;

    if (!noteElement || isExpanded) {
      return;
    }

    setCanExpand(noteElement.scrollHeight > noteElement.clientHeight);
  }, [note, isExpanded]);

  return (
    <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Note
      </p>

      <p
        ref={noteRef}
        className={`mt-1 whitespace-pre-wrap text-sm leading-5 text-slate-600 ${
          isExpanded ? "" : "line-clamp-5"
        }`}
      >
        {note}
      </p>

      {canExpand && (
        <button
          type="button"
          onClick={() => setIsExpanded((currentValue) => !currentValue)}
          className="mt-2 text-sm font-medium text-blue-600 hover:underline"
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

export default function Home() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [interestedSort, setInterestedSort] =
    useState<InterestedSortOption>("deadline");

  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [status, setStatus] = useState<ApplicationStatus | "">("");
  const [postedDate, setPostedDate] = useState<string | null>(null);
  const [deadline, setDeadline] = useState<string | null>(null);
  const [jobUrl, setJobUrl] = useState("");
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // 페이지가 처음 열릴 때 브라우저에 저장된 지원 기록을 불러옵니다.
  useEffect(() => {
    let savedApplications: JobApplication[] = [];

    try {
      const storedValue = localStorage.getItem("applyflow-applications");

      if (storedValue) {
        savedApplications = JSON.parse(storedValue) as JobApplication[];
      }
    } catch (error) {
      console.error("Failed to load applications:", error);
    }

    const timerId = window.setTimeout(() => {
      setApplications(savedApplications);
      setIsStorageLoaded(true);
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, []);

  // applications가 변경될 때마다 브라우저에 다시 저장합니다.
  useEffect(() => {
    if (!isStorageLoaded) {
      return;
    }

    localStorage.setItem(
      "applyflow-applications",
      JSON.stringify(applications),
    );
  }, [applications, isStorageLoaded]);

  function resetForm() {
    setCompany("");
    setPosition("");
    setStatus("");
    setPostedDate(null);
    setDeadline(null);
    setJobUrl("");
    setNote("");
    setEditingId(null);
  }

  function openAddForm() {
    resetForm();
    setIsFormOpen(true);
  }

  function closeForm() {
    resetForm();
    setIsFormOpen(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!company.trim() || !position.trim() || !status) {
      alert("Please complete all required fields.");
      return;
    }

    if (editingId) {
      setApplications((currentApplications) =>
        currentApplications.map((application) =>
          application.id === editingId
            ? {
                ...application,
                company: company.trim(),
                position: position.trim(),
                status: status,
                postedDate: postedDate || undefined,
                deadline: deadline || undefined,
                jobUrl: jobUrl.trim(),
                note: note.trim() || undefined,
              }
            : application,
        ),
      );

      closeForm();
      return;
    }

    const newApplication: JobApplication = {
      id: crypto.randomUUID(),
      company: company.trim(),
      position: position.trim(),
      status,
      postedDate: postedDate || undefined,
      deadline: deadline || undefined,
      jobUrl: jobUrl.trim(),
      note: note.trim() || undefined,
    };

    setApplications((currentApplications) => [
      newApplication,
      ...currentApplications,
    ]);

    closeForm();
  }

  function handleEdit(application: JobApplication) {
    setEditingId(application.id);
    setCompany(application.company);
    setPosition(application.position);
    setStatus(application.status);
    setPostedDate(application.postedDate ?? null);
    setDeadline(application.deadline ?? null);
    setJobUrl(application.jobUrl);
    setNote(application.note ?? "");

    setIsFormOpen(true);
  }

  function handleDelete(id: string) {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this application?",
    );

    if (!shouldDelete) {
      return;
    }

    setApplications((currentApplications) =>
      currentApplications.filter((application) => application.id !== id),
    );

    if (editingId === id) {
      resetForm();
    }

    setOpenMenuId(null);
  }

  const visibleApplications = [...applications]
    .filter((application) => {
      if (statusFilter === "All") {
        return true;
      }

      return application.status === statusFilter;
    })
    .sort((firstApplication, secondApplication) => {
      if (statusFilter === "Interested") {
        if (interestedSort === "deadline") {
          const deadlineComparison = compareOptionalDates(
            firstApplication.deadline,
            secondApplication.deadline,
          );

          if (deadlineComparison !== 0) {
            return deadlineComparison;
          }

          // Deadline이 같거나 둘 다 없으면 오래된 게시일 우선
          const postedDateComparison = compareOptionalDates(
            firstApplication.postedDate,
            secondApplication.postedDate,
          );

          if (postedDateComparison !== 0) {
            return postedDateComparison;
          }
        }

        if (interestedSort === "postedDate") {
          const postedDateComparison = compareOptionalDates(
            firstApplication.postedDate,
            secondApplication.postedDate,
          );

          if (postedDateComparison !== 0) {
            return postedDateComparison;
          }

          // 게시일이 같거나 둘 다 없으면 가까운 마감일 우선
          const deadlineComparison = compareOptionalDates(
            firstApplication.deadline,
            secondApplication.deadline,
          );

          if (deadlineComparison !== 0) {
            return deadlineComparison;
          }
        }

        return firstApplication.company.localeCompare(
          secondApplication.company,
        );
      }

      return firstApplication.company.localeCompare(secondApplication.company);
    });
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-blue-600">
            Personal Application Tracker
          </p>

          <h1 className="text-4xl font-bold tracking-tight">ApplyFlow</h1>

          <p className="mt-3 text-slate-600">
            Keep your job applications, deadlines, and progress in one place.
          </p>
        </header>

        <section>
          <div className="mb-5 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">My applications</h2>

                <p className="mt-1 text-sm text-slate-500">
                  Showing {visibleApplications.length} of {applications.length}{" "}
                  applications
                </p>
              </div>

              <button
                type="button"
                onClick={openAddForm}
                className="w-fit rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                + Add application
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {(["All", ...STATUS_OPTIONS] as StatusFilter[]).map(
                (filterOption) => (
                  <button
                    key={filterOption}
                    type="button"
                    onClick={() => setStatusFilter(filterOption)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      statusFilter === filterOption
                        ? "bg-blue-600 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {filterOption}
                  </button>
                ),
              )}
            </div>

            {statusFilter === "Interested" && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label
                  htmlFor="interested-sort"
                  className="text-sm font-medium text-slate-600"
                >
                  Sort by
                </label>

                <select
                  id="interested-sort"
                  value={interestedSort}
                  onChange={(event) =>
                    setInterestedSort(
                      event.target.value as InterestedSortOption,
                    )
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="deadline">Deadline</option>

                  <option value="postedDate">Posted date</option>
                </select>
              </div>
            )}
          </div>

          {visibleApplications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <p className="text-lg font-semibold">
                No {statusFilter === "All" ? "" : statusFilter.toLowerCase()}{" "}
                applications
              </p>

              <p className="mt-2 text-sm text-slate-500">
                {statusFilter === "All"
                  ? "Add your first job application."
                  : `There are no applications with the ${statusFilter} status.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleApplications.map((application) => (
                <article
                  key={application.id}
                  className="rounded-2xl bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">
                        {application.company}
                      </p>

                      <h3 className="mt-1 text-xl font-bold">
                        {application.position}
                      </h3>

                      <p className="mt-2 text-sm text-slate-500">
                        Posted: {application.postedDate || "Not recorded"}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Deadline: {application.deadline || "Not listed"}
                      </p>

                      {application.jobUrl && (
                        <a
                          href={application.jobUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline"
                        >
                          Open job posting ↗
                        </a>
                      )}

                      {application.note && (
                        <ExpandableNote note={application.note} />
                      )}
                    </div>

                    <div className="relative flex items-center gap-1">
                      <span className="text-sm font-bold text-slate-700">
                        {application.status}
                      </span>

                      <button
                        type="button"
                        aria-label={`Open actions for ${application.company}`}
                        aria-expanded={openMenuId === application.id}
                        onClick={() =>
                          setOpenMenuId((currentId) =>
                            currentId === application.id
                              ? null
                              : application.id,
                          )
                        }
                        className="flex h-8 w-5 items-center justify-center rounded-full text-xl font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                      >
                        ⋮
                      </button>

                      {openMenuId === application.id && (
                        <div className="absolute right-0 top-11 z-10 w-20 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                          <button
                            type="button"
                            onClick={() => {
                              handleEdit(application);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-blue-700 transition hover:bg-slate-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(application.id)}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {isFormOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="application-form-title"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeForm();
              }
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8"
          >
            <form
              onSubmit={handleSubmit}
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 id="application-form-title" className="text-xl font-bold">
                    {editingId ? "Edit application" : "Add an application"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Fields marked with{" "}
                    <span className="font-semibold text-red-500">*</span> are
                    required.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  aria-label="Close application form"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  ×
                </button>
              </div>

              <div className="space-y-5">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">
                    Company <span className="text-red-500">*</span>
                  </span>

                  <input
                    type="text"
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    required
                    className="h-12 w-full rounded-lg border border-slate-300 px-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium">
                    Position <span className="text-red-500">*</span>
                  </span>

                  <input
                    type="text"
                    value={position}
                    onChange={(event) => setPosition(event.target.value)}
                    required
                    className="h-12 w-full rounded-lg border border-slate-300 px-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium">
                    Status <span className="text-red-500">*</span>
                  </span>

                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as ApplicationStatus)
                    }
                    required
                    className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-4 pr-10 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="" disabled>
                      Select a status
                    </option>

                    {STATUS_OPTIONS.map((statusOption) => (
                      <option key={statusOption} value={statusOption}>
                        {statusOption}
                      </option>
                    ))}
                  </select>
                </label>

                <div>
                  <label
                    htmlFor="postedDate"
                    className="mb-1 block text-sm font-medium"
                  >
                    Posted date
                  </label>

                  {postedDate === null ? (
                    <button
                      type="button"
                      onClick={() => setPostedDate("")}
                      className="h-12 w-full rounded-lg border border-dashed border-slate-300 px-4 text-left text-sm text-slate-500 transition hover:border-blue-400 hover:bg-blue-50"
                    >
                      + Add posted date
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        id="postedDate"
                        type="date"
                        value={postedDate}
                        onChange={(event) => setPostedDate(event.target.value)}
                        className="h-12 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />

                      <button
                        type="button"
                        onClick={() => setPostedDate(null)}
                        className="rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="deadline"
                    className="mb-1 block text-sm font-medium"
                  >
                    Deadline
                  </label>

                  {deadline === null ? (
                    <button
                      type="button"
                      onClick={() => setDeadline("")}
                      className="h-12 w-full rounded-lg border border-dashed border-slate-300 px-4 text-left text-sm text-slate-500 transition hover:border-blue-400 hover:bg-blue-50"
                    >
                      + Add deadline
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        id="deadline"
                        type="date"
                        value={deadline}
                        onChange={(event) => setDeadline(event.target.value)}
                        className="h-12 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />

                      <button
                        type="button"
                        onClick={() => setDeadline(null)}
                        className="rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium">
                    Job posting URL
                  </span>

                  <input
                    type="url"
                    value={jobUrl}
                    onChange={(event) => setJobUrl(event.target.value)}
                    placeholder="https://..."
                    className="h-12 w-full rounded-lg border border-slate-300 px-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium">Note</span>

                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Add reminders, referral details, resume changes, or interview notes..."
                    rows={4}
                    className="w-full resize-y rounded-lg border border-slate-300 px-3 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
                  >
                    {editingId ? "Save changes" : "Add application"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
