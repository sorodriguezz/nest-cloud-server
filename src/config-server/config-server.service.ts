import { Injectable, Logger } from "@nestjs/common";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { ConfigServerModuleOptions } from "./config-server.module";
import { RepositoryManager } from "./interfaces/repository-manager.interface";
import { RepositoryBuilderFactory } from "../common/factories/repository-builder.factory";
import { getRepositoryUrl } from "../common/utils/directories.util";
import { ManageRepository } from "../manage-repository/manage-repository";

@Injectable()
export class ConfigServerService {
  private readonly logger = new Logger(ConfigServerService.name);
  private readonly repositories: any[] = [];

  async start(options: ConfigServerModuleOptions) {
    const repositories = options.repositories;
    const builder = new RepositoryBuilderFactory();

    const resp = repositories.map((repository: RepositoryManager) => {
      const urlBuilder = builder.getBuilder(repository.name);
      const pathBase = getRepositoryUrl(repository, urlBuilder);

      return { repository, urlBuilder, pathBase };
    });

    this.repositories.push(...resp);

    this.syncAllRepositories();
  }

  private async syncAllRepositories(): Promise<void> {
    this.logger.log("Starting repository synchronization...");

    await Promise.all(
      this.repositories.map((repo) =>
        new ManageRepository(
          repo.repository,
          repo.urlBuilder,
          repo.pathBase
        ).sync()
      )
    );

    this.logger.log("Repository synchronization completed");
  }

  private createDirectoryDatabase(path: string) {
    const dbDir = join(process.cwd(), path);

    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }
  }
}
