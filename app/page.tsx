"use client";

import { FormEvent, useEffect, useState } from "react";

type ApplicationStatus =
  | "Interested"
  | "Applied"
  | "Interview"
  | "Rejected"
  | "Offer";

type JobApplication = {
  id: string;
  company: string;
  position: string;
  status: ApplicationStatus;
  deadline: string;
  jobUrl: string;
};

const STATUS_OPTIONS: ApplicationStatus[] = [
  "Interested",
  "Applied",
  "Interview",
  "Rejected",
  "Offer",
];

export default function Home() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);

  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [status, setStatus] = useState<ApplicationStatus>("Interested");
  const [deadline, setDeadline] = useState("");
  const [jobUrl, setJobUrl] = useState("");

  // 페이지가 처음 열릴 때 브라우저에 저장된 지원 기록을 불러옵니다.
  useEffect(() => {
    try {
      const savedApplications = localStorage.getItem("applyflow-applications");

      if (savedApplications) {
        const parsedApplications = JSON.parse(
          savedApplications,
        ) as JobApplication[];

        setApplications(parsedApplications);
      }
    } catch (error) {
      console.error("Failed to load applications:", error);
    } finally {
      setIsStorageLoaded(true);
    }
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!company.trim() || !position.trim()) {
      alert("회사명과 직무명을 입력해주세요.");
      return;
    }

    const newApplication: JobApplication = {
      id: crypto.randomUUID(),
      company: company.trim(),
      position: position.trim(),
      status,
      deadline,
      jobUrl: jobUrl.trim(),
    };

    setApplications((currentApplications) => [
      newApplication,
      ...currentApplications,
    ]);

    setCompany("");
    setPosition("");
    setStatus("Interested");
    setDeadline("");
    setJobUrl("");
  }

  function handleStatusChange(id: string, newStatus: ApplicationStatus) {
    setApplications((currentApplications) =>
      currentApplications.map((application) =>
        application.id === id
          ? { ...application, status: newStatus }
          : application,
      ),
    );
  }

  function handleDelete(id: string) {
    const shouldDelete = window.confirm("Do you want to delete?");

    if (!shouldDelete) {
      return;
    }

    setApplications((currentApplications) =>
      currentApplications.filter((application) => application.id !== id),
    );
  }

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

        <section className="grid gap-8 lg:grid-cols-[360px_1fr]">
          <form
            onSubmit={handleSubmit}
            className="h-fit rounded-2xl bg-white p-6 shadow-sm"
          >
            <h2 className="mb-6 text-xl font-bold">Add an application</h2>

            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  Company *
                </span>

                <input
                  type="text"
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  placeholder="Ex. Google, NVDIA, META ..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  Position *
                </span>

                <input
                  type="text"
                  value={position}
                  onChange={(event) => setPosition(event.target.value)}
                  placeholder="Cloud Infrastructure Engineer"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium">Status</span>

                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as ApplicationStatus)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {STATUS_OPTIONS.map((statusOption) => (
                    <option key={statusOption} value={statusOption}>
                      {statusOption}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium">Deadline</span>

                <input
                  type="date"
                  value={deadline}
                  onChange={(event) => setDeadline(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  Job posting URL
                </span>

                <input
                  type="url"
                  value={jobUrl}
                  onChange={(event) => setJobUrl(event.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                Add application
              </button>
            </div>
          </form>

          <div>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold">My applications</h2>

                <p className="mt-1 text-sm text-slate-500">
                  {applications.length} application
                  {applications.length === 1 ? "" : "s"} recorded
                </p>
              </div>
            </div>

            {applications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <p className="text-lg font-semibold">No applications yet</p>

                <p className="mt-2 text-sm text-slate-500">
                  Add your first job application using the form.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => (
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
                          Deadline: {application.deadline || "Not set"}
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
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={application.status}
                          onChange={(event) =>
                            handleStatusChange(
                              application.id,
                              event.target.value as ApplicationStatus,
                            )
                          }
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        >
                          {STATUS_OPTIONS.map((statusOption) => (
                            <option key={statusOption} value={statusOption}>
                              {statusOption}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => handleDelete(application.id)}
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
