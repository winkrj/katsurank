package com.katsurank;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import jakarta.persistence.Entity;
import org.junit.jupiter.api.Test;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/**
 * 계층 의존 방향(Controller/Service/Repository/Entity)과 ranking↛restaurant 기능 간 독립성을
 * ArchUnit으로 강제한다. 위반 시 각 규칙의 because() 메시지에 원인과 수정 방법을 명시한다.
 */
class ArchitectureTest {

    private final JavaClasses classes = new ClassFileImporter()
            .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
            .importPackages("com.katsurank");

    @Test
    void controllersDoNotDependOnRepositories() {
        noClasses().that().resideInAPackage("..controller..")
                .should().dependOnClassesThat().resideInAPackage("..repository..")
                .because("Controller는 Repository를 직접 호출할 수 없다. Repository 접근 코드를 Service로 옮기고, "
                        + "Controller는 Service를 통해서만 호출하라 (docs/04_code_convention.md §1 3계층 원칙).")
                .check(classes);
    }

    @Test
    void entitiesDoNotDependOnWebLayer() {
        noClasses().that().areAnnotatedWith(Entity.class)
                .should().dependOnClassesThat()
                .resideInAnyPackage("..controller..", "..dto..", "..common.web..")
                .because("Entity는 Controller/DTO/common.web에 의존할 수 없다. Entity가 DTO를 참조하고 있다면 의존 방향이 반대다 — "
                        + "DTO의 정적 팩토리 from(Entity)가 Entity를 참조해야지 그 반대가 되면 안 된다 (docs/04_code_convention.md §4).")
                .check(classes);
    }

    @Test
    void servicesDoNotDependOnWebLayer() {
        noClasses().that().resideInAPackage("..service..")
                .should().dependOnClassesThat().resideInAPackage("..controller..")
                .because("Service는 Controller 패키지에 의존할 수 없다. HttpStatus·ResponseEntity 같은 HTTP 개념이나 Controller "
                        + "타입을 참조하고 있다면, Service는 순수 도메인 타입만 반환하고 HTTP 매핑은 Controller로 옮겨라 "
                        + "(docs/04_code_convention.md §1 계층 책임표).")
                .check(classes);
    }

    @Test
    void repositoriesDoNotDependOnUpperLayers() {
        noClasses().that().resideInAPackage("..repository..")
                .should().dependOnClassesThat()
                .resideInAnyPackage("..controller..", "..service..")
                .because("Repository는 Controller와 Service 계층에 의존하면 안 된다. Repository가 상위 계층 타입을 참조하고 있다면 "
                        + "그 로직을 Service로 옮기거나, 조회 전용 로직이면 XxxQueryRepository로 분리하라 (docs/04_code_convention.md §1.1).")
                .check(classes);
    }

    @Test
    void rankingServiceDoesNotDependOnRestaurantFeature() {
        noClasses().that().resideInAPackage("..ranking.service..")
                .should().dependOnClassesThat().resideInAPackage("..restaurant..")
                .because("Ranking Service는 Restaurant 기능 패키지로부터 독립되어야 한다. 정렬·집계 로직은 ranking의 "
                        + "QueryRepository가 소유해야 하며, Restaurant 데이터가 필요하면 그 Repository/Entity를 ranking의 "
                        + "QueryRepository에서 직접 조회하라 — Service 간 상호 호출로 계층을 우회하지 마라 (docs/04_code_convention.md §1.1).")
                .check(classes);
    }
}
