import { ModuleCard } from './components/module-card';
import { adminModules } from './lib/modules';

export function App() {
  return (
    <main className="admin-shell">
      <aside className="sidebar">
        <p className="brand">JOY Admin</p>
        <nav>
          {adminModules.map((module) => (
            <a href={`#${module.key}`} key={module.key}>
              {module.title}
            </a>
          ))}
        </nav>
      </aside>

      <section className="content">
        <div className="panel">
          <p className="tag">Admin Rebuild</p>
          <h1>管理台骨架已经完成</h1>
          <p>
            下一步按运营最小闭环补登录、竞猜审核、订单履约、仓库查看和用户管理。
          </p>
        </div>

        <div className="grid">
          {adminModules.map((module) => (
            <ModuleCard
              key={module.key}
              title={module.title}
              description={module.description}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
