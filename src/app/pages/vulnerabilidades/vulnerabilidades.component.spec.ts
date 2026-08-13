import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VulnerabilidadesComponent } from './vulnerabilidades.component';

describe('VulnerabilidadesComponent', () => {
  let component: VulnerabilidadesComponent;
  let fixture: ComponentFixture<VulnerabilidadesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VulnerabilidadesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VulnerabilidadesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
